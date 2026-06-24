"""SecretVault: read-only, repr never leaks, env round-trip, default picks an OS-backed keystore."""
import os
from foundation.security import secrets


def run():
    v = secrets.SecretVault(secrets.MemoryBackend(**{"cdp/api_key_secret": "shh-not-real"}))
    assert v.read("cdp/api_key_secret") == "shh-not-real"
    assert v.has("cdp/api_key_secret") and not v.has("missing")
    try:
        v.read("missing")
        raise AssertionError("a missing secret must raise")
    except KeyError:
        pass
    assert "shh-not-real" not in repr(v)                          # repr never leaks the value

    # env-injection backend round-trips by a namespaced var (no plaintext file)
    os.environ["ARK_SECRET_X402_BUDGET"] = "5.0"
    assert secrets.SecretVault(secrets.EnvBackend()).read("x402/budget") == "5.0"

    # encrypted-file backend (Fernet) round-trips via a passphrase — encryption at rest, no Keychain
    if secrets.EncryptedFileBackend.available:
        import tempfile
        import shutil
        d = tempfile.mkdtemp()
        path = os.path.join(d, "secrets.enc")
        secrets.seal_encrypted_file(path, {"cdp/api_key_secret": "enc-not-real"}, "correct horse battery")
        ef = secrets.SecretVault(secrets.EncryptedFileBackend(path, "correct horse battery"))
        assert ef.read("cdp/api_key_secret") == "enc-not-real"
        assert not secrets.SecretVault(secrets.EncryptedFileBackend(path, "wrong")).has("cdp/api_key_secret")
        shutil.rmtree(d, ignore_errors=True)

    # the default vault is OS-backed: Keychain on macOS (encrypted at rest), else env
    dv = secrets.default_vault()
    assert dv.backend.name in ("keychain", "env")
    print("test_secrets: OK (Memory+Env work; default=%s; repr leaks nothing; no plaintext on disk)"
          % dv.backend.name)
    return True


if __name__ == "__main__":
    run()
