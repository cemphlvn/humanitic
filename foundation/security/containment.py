"""
containment — the system is its own contained environment: reachable ONLY through the interface, and
allowed to reach ONLY allowlisted endpoints.

  • Interface boundary  — the sole entry is the CLI gateway (`run.sh` -> `foundation.runtime.cli`). No
    other code path performs I/O on a caller's behalf; you interact through commands, not internals.
  • Egress allowlist    — every outbound network call routes through a policy `guard(url)`. LAN/localhost
    (e.g. a Hivemapper ODC device) is allowed; a PUBLIC host not on the allowlist raises. Default-deny
    for the public internet.
  • Filesystem confinement — writes are confined to `.local/` (and the scratch dir); `assert_confined`
    refuses paths outside.
  • Resource limits      — MemoryGuard (RAM) + setrlimit (CPU/AS) cap the blast radius.

App-level guards are necessary but NOT sufficient on their own — for true OS isolation use the
`sandbox-exec` profile (`templates/ark.sb`, macOS) or the container (`templates/Dockerfile`). This module
is the in-process layer of a defense-in-depth stack.
"""
import os
import ipaddress
from urllib.parse import urlparse

# default public-egress allowlist — only the configured live data endpoints. Extend via machine config.
DEFAULT_ALLOW = ("geodnet.com", "hivemapper.com", "api.coingecko.com", "api.llama.fi", "base.org")


def _is_local(host):
    if host in ("localhost", ""):
        return host == "localhost"
    try:
        ip = ipaddress.ip_address(host)
        return ip.is_private or ip.is_loopback
    except ValueError:
        return False


class EgressPolicy:
    def __init__(self, allow_hosts):
        self.allow = tuple(allow_hosts)

    def allowed(self, url):
        host = urlparse(url).hostname or ""
        if _is_local(host):                                   # LAN device (e.g. ODC) / localhost
            return True
        return any(host == a or host.endswith("." + a) for a in self.allow)

    def guard(self, url):
        if not self.allowed(url):
            raise PermissionError("egress denied: %r not in allowlist %s"
                                  % (urlparse(url).hostname, list(self.allow)))
        return url


def default_policy(extra=()):
    return EgressPolicy(tuple(DEFAULT_ALLOW) + tuple(extra))


def assert_confined(path, roots=(".local",)):
    """A write path must live under an allowed root (.local/ or the scratch dir). Refuses anything else."""
    rp = os.path.realpath(path)
    extra = [d for d in (os.environ.get("CLAUDE_SCRATCH"), os.environ.get("TMPDIR")) if d]
    for root in list(roots) + extra:
        rr = os.path.realpath(root)
        if rp == rr or rp.startswith(rr + os.sep):
            return True
    raise PermissionError("filesystem confinement: %s is outside %s" % (path, list(roots)))


def status():
    import shutil
    return {
        "interface": "run.sh -> foundation.runtime.cli (sole entry; interact via commands, not internals)",
        "egress_allowlist": list(DEFAULT_ALLOW) + ["<LAN/localhost>"],
        "fs_confinement": [".local/", "<scratch>"],
        "memory_guard": "foundation.runtime.memory.MemoryGuard (tunable RAM cap, fails safe)",
        "live_secrets": "SecretVault — Keychain / Secure Enclave / encrypted file (never plaintext)",
        "os_isolation": {"sandbox_exec": bool(shutil.which("sandbox-exec")),
                         "docker": bool(shutil.which("docker")),
                         "profiles": ["templates/ark.sb (macOS)", "templates/Dockerfile (prod)"]},
    }
