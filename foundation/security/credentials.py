"""
credentials — resolve LIVE credentials through the SecretVault (Keychain / Secure Enclave / encrypted
file), with a plain-environment fallback. Values are NEVER logged and NEVER returned by describe(); only
their PRESENCE is reported. The vault is the secure store; a plain env var is a convenience fallback.

How to add your live credentials (most secure first):
  • macOS Keychain (Secure-Enclave-backed, encrypted at rest, no plaintext file):
        security add-generic-password -s ark -a NTRIP_CASTER     -w
        security add-generic-password -s ark -a NTRIP_MOUNTPOINT -w
        security add-generic-password -s ark -a NTRIP_USER       -w
        security add-generic-password -s ark -a NTRIP_PASS       -w
        security add-generic-password -s ark -a ODC_API_URL      -w     # Hivemapper ODC device URL
    (-w prompts for the value; it is NOT echoed to shell history or the process list.)
  • Encrypted file fallback (no Keychain): foundation.security.secrets.seal_encrypted_file(...).
  • Env injection (ephemeral, never persisted): export NTRIP_CASTER=...  (or ARK_SECRET_NTRIP_CASTER).

Check what's configured (presence only): ./run.sh creds [--target geodnet]
"""
import os

from foundation.security import secrets

# the live keys each target needs (the vault key == the env-var name)
LIVE_KEYS = {
    "geodnet": ["NTRIP_CASTER", "NTRIP_MOUNTPOINT", "NTRIP_USER", "NTRIP_PASS"],
    "hivemapper": ["ODC_API_URL"],
    "market": ["COINGECKO_API_KEY"],
}

_VAULT = None


def _vault():
    global _VAULT
    if _VAULT is None:
        _VAULT = secrets.default_vault()
    return _VAULT


def resolve(key, vault=None):
    """Vault first (Keychain/Secure-Enclave/encrypted), then a plain env var. None if absent. Never logged."""
    v = vault or _vault()
    try:
        if v.has(key):
            return v.read(key)
    except Exception:
        pass
    return os.environ.get(key)


def present(key, vault=None):
    val = resolve(key, vault=vault)
    return val is not None and val != ""


def describe(target=None, vault=None):
    """Presence-only report (never the value) — safe to print/log."""
    keys = LIVE_KEYS.get(target) if target else [k for ks in LIVE_KEYS.values() for k in ks]
    return {k: ("present" if present(k, vault=vault) else "MISSING") for k in keys}


def ready(target, vault=None):
    """True iff every required key for `target` is present."""
    return all(present(k, vault=vault) for k in LIVE_KEYS.get(target, []))
