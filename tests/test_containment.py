"""Credentials (presence-only, never leaked) + containment (egress allowlist, fs confinement, interface)."""
from foundation.security import credentials as cred
from foundation.security import containment as cont
from foundation.security import secrets


def run():
    # credentials resolve through the vault; describe reports PRESENCE only, never the value
    vault = secrets.SecretVault(secrets.MemoryBackend(NTRIP_CASTER="caster.example.com"))
    d = cred.describe("geodnet", vault=vault)
    assert d["NTRIP_CASTER"] == "present" and d["NTRIP_USER"] == "MISSING"
    assert set(d.values()) <= {"present", "MISSING"}            # never a value
    assert "caster.example.com" not in repr(d)
    assert cred.resolve("ARK_DEFINITELY_ABSENT_KEY_XYZ", vault=vault) is None
    assert cred.ready("geodnet", vault=vault) is False          # USER/PASS/MOUNTPOINT missing

    # egress allowlist: LAN/allowlisted allowed, other public hosts denied
    pol = cont.default_policy()
    assert pol.allowed("https://geodnet.com/network")
    assert pol.allowed("http://192.168.1.50:5000/gps")          # LAN ODC device
    assert not pol.allowed("https://evil.example.com/exfil")
    try:
        pol.guard("https://evil.example.com/exfil")
        raise AssertionError("egress must be denied")
    except PermissionError:
        pass

    # filesystem confinement: .local allowed, outside refused
    assert cont.assert_confined(".local/mined/x.json")
    try:
        cont.assert_confined("/etc/passwd")
        raise AssertionError("must confine")
    except PermissionError:
        pass

    s = cont.status()
    assert "egress_allowlist" in s and "interface" in s and "os_isolation" in s
    print("test_containment: OK (creds presence-only & non-leaking; egress allowlist; fs confinement; status)")
    return True


if __name__ == "__main__":
    run()
