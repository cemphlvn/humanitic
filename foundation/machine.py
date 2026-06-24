"""
machine — a declarable, per-MACHINE config. Each machine declares its own setup (secret backend,
inference engine, broker, risk, onchain network) in a config file; the system reads it to wire itself.

Search order: $ARK_MACHINE_CONFIG · ./ark.machine.yaml · ./ark.machine.json · .local/machine.yaml
Sensible defaults when none is declared (stub engine, paper broker, conservative risk, keychain
secrets, testnet-first). YAML or JSON; deep-merged over the defaults.
"""
import os
import json

DEFAULTS = {
    "machine": "default",
    "secrets": {"backend": "keychain"},                       # keychain | encrypted-file | env
    "inference": {"engine": "stub"},                          # stub | mlx | ollama
    "execution": {"broker": "paper", "risk": "conservative", "live": False},
    "onchain": {"network": "base-sepolia", "x402_budget_usdc": 5.0, "x402_max_single_usdc": 0.50},
}
SEARCH = ["ark.machine.yaml", "ark.machine.json", os.path.join(".local", "machine.yaml")]


def _deep_merge(base, over):
    out = dict(base)
    for k, v in (over or {}).items():
        out[k] = _deep_merge(base.get(k, {}), v) if isinstance(v, dict) and isinstance(base.get(k), dict) else v
    return out


def _read(path):
    text = open(path).read()
    if path.endswith((".yaml", ".yml")):
        import yaml
        return yaml.safe_load(text) or {}
    return json.loads(text)


class MachineConfig:
    def __init__(self, data):
        self.data = data

    @classmethod
    def load(cls, path=None):
        candidates = [path] if path else (
            ([os.environ["ARK_MACHINE_CONFIG"]] if "ARK_MACHINE_CONFIG" in os.environ else []) + SEARCH)
        for p in candidates:
            if p and os.path.exists(p):
                return cls(_deep_merge(DEFAULTS, _read(p)))
        return cls(dict(DEFAULTS))

    def get(self, *keys, default=None):
        d = self.data
        for k in keys:
            if not isinstance(d, dict) or k not in d:
                return default
            d = d[k]
        return d

    @property
    def engine(self):
        return self.get("inference", "engine", default="stub")

    @property
    def broker(self):
        return self.get("execution", "broker", default="paper")

    @property
    def risk(self):
        return self.get("execution", "risk", default="conservative")

    @property
    def network(self):
        return self.get("onchain", "network", default="base-sepolia")

    def secrets_vault(self):
        """Build the SecretVault declared by this machine's config (keychain | encrypted-file | env)."""
        from foundation.security import secrets
        backend = self.get("secrets", "backend", default="keychain")
        if backend == "keychain" and secrets.KeychainBackend.available:
            return secrets.SecretVault(secrets.KeychainBackend())
        if backend == "encrypted-file":
            path = self.get("secrets", "path", default=os.path.join(".local", "secrets.enc"))
            pp_env = self.get("secrets", "passphrase_env", default="ARK_ENC_PASS")
            return secrets.SecretVault(secrets.EncryptedFileBackend(path, os.environ.get(pp_env, "")))
        return secrets.SecretVault(secrets.EnvBackend())
