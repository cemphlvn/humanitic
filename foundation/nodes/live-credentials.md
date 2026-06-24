# Node — Live Credentials (how to add them, securely)

> **TR** — Canlı kimlik bilgileri ASLA düz metin değil: macOS Keychain (Secure Enclave) / şifreli dosya /
> env. `credentials.resolve` kasadan çözer; `describe` yalnız VARLIK bildirir (değeri değil).
> **EN** — Live credentials are NEVER plaintext: macOS Keychain (Secure Enclave) / encrypted file / env.
> `credentials.resolve` reads from the vault; `describe` reports PRESENCE only (never the value).
> **ZH** — 实时凭证绝不明文：macOS Keychain（安全隔区）/ 加密文件 / 环境变量。`credentials.resolve`
> 从保险库读取；`describe` 仅报告存在性（绝不报告值）。

**Status:** ADOPTED. Code: `foundation/security/credentials.py` (+ `secrets.py`). Check: `./run.sh creds`.

## Add your credentials (most secure first)
**1 — macOS Keychain (recommended; Secure-Enclave-backed, encrypted at rest, no plaintext file):**
```bash
security add-generic-password -s ark -a NTRIP_CASTER     -w   # e.g. ntrip.geodnet.com:2101
security add-generic-password -s ark -a NTRIP_MOUNTPOINT -w   # your station/area mountpoint
security add-generic-password -s ark -a NTRIP_USER       -w
security add-generic-password -s ark -a NTRIP_PASS       -w
security add-generic-password -s ark -a ODC_API_URL      -w   # Hivemapper ODC device URL
```
`-w` prompts for the value — it is NOT echoed to shell history or the process list.

**2 — Encrypted file (no Keychain):** `secrets.seal_encrypted_file(path, {...}, passphrase)` (Fernet, 0600;
keep the passphrase in the Keychain). **3 — Env injection (ephemeral):** `export NTRIP_CASTER=...`.

## How it resolves & verifies
`credentials.resolve(key)` tries the **vault first** (Keychain/Secure Enclave/encrypted), then a plain env
var; returns `None` if absent. Adapters resolve through it (`GeodnetNTRIP`, `HivemapperODC`). Then:
```bash
./run.sh creds --target geodnet     # {"NTRIP_CASTER":"present","NTRIP_USER":"MISSING", ...}
./run.sh mine --target geodnet --live    # uses the resolved creds; raises clearly if any are MISSING
```
`describe`/`creds` print **presence only** — values are never logged, returned, or published (Article 0 +
the SecretVault `__repr__` never leaks). `test_containment` asserts the non-leak + presence semantics.
