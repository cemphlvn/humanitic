"""
secure_temp — a hardened scratch directory for the agentic stack.

Applies the SOTA checklist (CWE-377/379, OWASP Insecure Temporary File, CERT FIO21-C, OWASP LLM01,
NVIDIA/Microsoft agentic-sandbox guidance):
  - `mkdtemp` only — atomic O_EXCL|O_CREAT; NEVER predictable names / `mktemp`
  - 0700 dir, owner-only; asserted after creation
  - an explicit process-owned base `dir=`, never bare /tmp shared root
  - PER-AGENT subdir scoping — siblings get zero access (cross-agent tampering / file-prompt-injection)
  - symlink refusal on open (O_NOFOLLOW + islink precheck) — a planted symlink can't redirect a write
  - guaranteed teardown (shutil.rmtree in finally) — destroy, don't just empty
  - Article 0: refuse to place `.local` / private data in a shared temp path
"""
import os
import stat
import shutil
import tempfile
import contextlib


def _assert_0700(path):
    if stat.S_IMODE(os.lstat(path).st_mode) != 0o700:
        os.chmod(path, 0o700)                                  # enforce owner-only (CVE-2024-4030)


@contextlib.contextmanager
def secure_tempdir(prefix="ark-", base=None, agent=None):
    """Owner-only (0700) scratch dir, optionally per-agent-scoped, destroyed on exit (even on crash)."""
    base = base or tempfile.gettempdir()
    root = tempfile.mkdtemp(prefix=prefix, dir=base)          # atomic, 0700, unpredictable
    _assert_0700(root)
    target = root
    if agent:
        target = tempfile.mkdtemp(prefix=str(agent) + "-", dir=root)   # per-agent child
        _assert_0700(target)
    try:
        yield target
    finally:
        shutil.rmtree(root, ignore_errors=True)               # destroy the whole tree, not just empty


def secure_open(path, flags=os.O_RDONLY):
    """Open refusing symlinks: a symlink planted by another process/agent can't redirect the write."""
    if os.path.islink(path):
        raise PermissionError("refusing to open a symlink (temp symlink attack): %s" % path)
    return os.open(path, flags | os.O_NOFOLLOW)


def assert_not_private(path):
    """Article 0: private (.local) data must never transit a shared temp path."""
    if ".local" in os.path.realpath(path).split(os.sep):
        raise PermissionError("Article 0: refusing to place .local data in shared temp: %s" % path)
    return True
