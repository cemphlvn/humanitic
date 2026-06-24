"""
secrets — a SECRET VAULT for keys, ENCRYPTED AT REST. The mechanism is open (this file); the keys are
private (macOS Keychain / Secure Enclave). Wallet/API secrets never sit in plaintext on disk, never
log, never publish. The runtime calls `vault.read("cdp/api_key_secret")`; the value lives in the
OS-backed keystore.

Backends (default = Keychain on macOS, else env injection):
  KeychainBackend  — macOS `security` CLI; Secure-Enclave-backed, encrypted at rest, NO plaintext file
  EnvBackend       — read from the environment (runtime injection; never persisted to disk)
  MemoryBackend    — for tests

Store a key (interactive — the value is NOT echoed to shell history or the process list):
  security add-generic-password -s ark -a cdp/api_key_secret -w
"""
import os
import sys
import shutil
import subprocess

SERVICE = "ark"                                              # the keychain service namespace


class KeychainBackend:
    name = "keychain"
    available = sys.platform == "darwin" and shutil.which("security") is not None

    def read(self, key):
        try:
            out = subprocess.run(["security", "find-generic-password", "-s", SERVICE, "-a", key, "-w"],
                                 capture_output=True, text=True, check=True)
            return out.stdout.rstrip("\n")
        except subprocess.CalledProcessError:
            raise KeyError("secret not in keychain: %s/%s  (add: security add-generic-password -s %s "
                           "-a %s -w)" % (SERVICE, key, SERVICE, key))

    def has(self, key):
        try:
            self.read(key)
            return True
        except KeyError:
            return False


class EnvBackend:
    name = "env"
    available = True

    @staticmethod
    def _var(key):
        return "ARK_SECRET_" + key.replace("/", "_").replace("-", "_").upper()

    def read(self, key):
        v = os.environ.get(self._var(key))
        if v is None:
            raise KeyError("secret not in env: %s" % self._var(key))
        return v

    def has(self, key):
        return os.environ.get(self._var(key)) is not None


class MemoryBackend:
    name = "memory"
    available = True

    def __init__(self, **kv):
        self._kv = dict(kv)

    def read(self, key):
        if key not in self._kv:
            raise KeyError(key)
        return self._kv[key]

    def has(self, key):
        return key in self._kv


class EncryptedFileBackend:
    """An ENCRYPTED secrets file (Fernet = AES-128-CBC + HMAC, `cryptography`). The key is derived
    (scrypt) from a passphrase that lives in the Keychain or env — never beside the file. This is the
    encryption-at-rest path when Keychain isn't available (cross-platform). File = salt(16) + token,
    0600."""
    name = "encrypted-file"
    try:
        import cryptography  # noqa: F401
        available = True
    except Exception:
        available = False

    def __init__(self, path, passphrase):
        self.path = path
        self._pass = passphrase
        self._cache = None

    @staticmethod
    def _derive(passphrase, salt):
        import base64
        import hashlib
        return base64.urlsafe_b64encode(
            hashlib.scrypt(passphrase.encode(), salt=salt, n=2 ** 14, r=8, p=1, dklen=32))

    def _load(self):
        if self._cache is None:
            import json
            from cryptography.fernet import Fernet
            raw = open(self.path, "rb").read()
            salt, token = raw[:16], raw[16:]
            self._cache = json.loads(Fernet(self._derive(self._pass, salt)).decrypt(token).decode())
        return self._cache

    def read(self, key):
        d = self._load()
        if key not in d:
            raise KeyError(key)
        return d[key]

    def has(self, key):
        try:
            return key in self._load()
        except Exception:
            return False


def seal_encrypted_file(path, secrets_dict, passphrase):
    """Create the encrypted store: salt(16) + Fernet(token), 0600. Only the passphrase needs
    protecting — keep it in the Keychain (`security add-generic-password -s ark -a enc/passphrase -w`)."""
    import os as _os
    import json
    from cryptography.fernet import Fernet
    salt = _os.urandom(16)
    token = Fernet(EncryptedFileBackend._derive(passphrase, salt)).encrypt(json.dumps(secrets_dict).encode())
    with open(path, "wb") as f:
        f.write(salt + token)
    _os.chmod(path, 0o600)
    return path


class SecretVault:
    """Read-only secret access. NEVER logs/returns values except via read(); not publishable."""
    def __init__(self, backend):
        self.backend = backend

    def read(self, key):
        return self.backend.read(key)

    def has(self, key):
        return self.backend.has(key)

    def __repr__(self):
        return "SecretVault(backend=%s)" % self.backend.name      # never leak a value


def default_vault():
    """Keychain on macOS (encrypted at rest, Secure-Enclave-backed); else environment injection."""
    return SecretVault(KeychainBackend() if KeychainBackend.available else EnvBackend())
