# Node — Secret Vault (keys encrypted at rest) + crypto custody

> **TR** — Anahtarlar düz metin olarak diskte DURMAZ. macOS Keychain (Secure Enclave) ile durağan
> şifreli; Keychain yoksa şifreli dosya (Fernet). Kripto cüzdan sırları asla düz metin değil.
> **EN** — Keys never sit in plaintext on disk. Encrypted at rest via macOS Keychain (Secure Enclave);
> an encrypted file (Fernet) when there's no Keychain. Crypto wallet secrets are never plaintext.
> **ZH** — 密钥从不以明文存于磁盘。通过 macOS 钥匙串（Secure Enclave）静态加密；无钥匙串时用加密文件
> （Fernet）。加密钱包私钥绝不明文。

**Status:** ADOPTED. Code: `foundation/security/secrets.py`. Config: `foundation/machine.py`.

## The mechanism is open; the keys are private
`SecretVault.read("cdp/api_key_secret")` returns a value used **in-memory only** — never logged
(`__repr__` leaks nothing), never written to disk, never routed through the publish guard.

## Apple guidance (grounded in the Security framework docs)
- Use the **data-protection keychain** with **`kSecAttrAccessibleWhenUnlockedThisDeviceOnly`** ("aku"):
  the secret is readable only while the device is **unlocked** and, because it's a *ThisDeviceOnly*
  class, **never syncs to iCloud**. CLI items in the login keychain are already device-only (no sync).
- Gate the most sensitive items with **`SecAccessControl`** (`.biometryAny`) → Touch ID on read.
- For self-custody **signing keys**, use the **Secure Enclave** (`kSecAttrTokenIDSecureEnclave`): the
  private key is generated in and **never leaves** the chip — you sign through it. This is the local
  mirror of CDP's TEE.

```bash
# store a secret (interactive; not echoed to history or `ps`); login-keychain items don't iCloud-sync
security add-generic-password -s ark -a cdp/api_key_secret -w
```
```python
from foundation.security.secrets import default_vault
api_secret = default_vault().read("cdp/api_key_secret")   # Keychain on macOS; never logged/published
```

## No Keychain? Encrypted file (Fernet, cross-platform)
`seal_encrypted_file(path, {...}, passphrase)` writes `salt(16) + Fernet(token)` at `0600`; the
scrypt-derived key never sits beside the file — keep the **passphrase in the Keychain**. Declare it in
the machine config (`secrets.backend: encrypted-file`).

## Crypto custody — the field's scar tissue (Reddit consensus)
The recurring drain stories trace to the same root: **a private key or seed phrase in plaintext** (a
file, a note, a screenshot, a `.env`, the clipboard) that an infostealer scanned. The hard-won rules:
- **Never** store seed phrases / raw private keys in plaintext. Use an OS keystore or a hardware wallet.
- For an **autonomous/agent wallet**, hold custody in a **TEE or MPC** (CDP Server Wallets v2 — keys in
  Coinbase's TEE) or the **Secure Enclave**; the raw key never lands on the agent's disk.
- **Hot-wallet discipline:** keep only what you can lose in the agent's hot wallet; the rest cold.
- **Spend limits + testnet-first:** CDP Spend Permissions (a per-period allowance independent of the
  RiskGate) + x402 budget/single-payment caps + the testnet-gate. ark wires all of these.
