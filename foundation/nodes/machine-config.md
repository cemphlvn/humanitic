# Node — Declarable Machine Config

> **TR** — Her makine kendi kurulumunu (sır arka-ucu, çıkarım motoru, broker, risk, zincir ağı) bir
> config dosyasında BEYAN EDER; sistem kendini ona göre bağlar. Yoksa makul varsayılanlar.
> **EN** — Each machine DECLARES its own setup (secret backend, inference engine, broker, risk, chain
> network) in a config file; the system wires itself from it. Sensible defaults when none is declared.
> **ZH** — 每台机器在配置文件中**声明**自己的设置（密钥后端、推理引擎、券商、风险、链网络）；
> 系统据此自我接线。未声明时使用合理默认值。

**Status:** ADOPTED. Code: `foundation/machine.py`. Template: `ark.machine.example.yaml`.

## Declare your machine
Search order: `$ARK_MACHINE_CONFIG` · `./ark.machine.yaml` · `./ark.machine.json` · `.local/machine.yaml`
(the `.local` one overrides the repo-level one — your private machine on top of a shared default).
YAML or JSON; deep-merged over the defaults.

```yaml
machine: cem-macbook
secrets:   { backend: keychain }          # keychain | encrypted-file | env
inference: { engine: stub }               # stub | mlx | ollama
execution: { broker: paper, risk: conservative, live: false }
onchain:   { network: base-sepolia, x402_budget_usdc: 5.0, x402_max_single_usdc: 0.50 }
```

## Use it
```python
from foundation.machine import MachineConfig
cfg = MachineConfig.load()
engine, broker, network = cfg.engine, cfg.broker, cfg.network
vault = cfg.secrets_vault()                # keychain | encrypted-file | env, as declared
api = vault.read("cdp/api_key_secret")
```

The machine config is the **one place** a person or org declares how *their* node runs — keys backend,
local model, broker, risk, chain — so the same open substrate runs differently (and safely) on every
machine, with secrets never in plaintext and live capital always gated.
