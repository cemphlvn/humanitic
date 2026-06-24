"""
onchain — the CDP onchain execution adapter (Coinbase Developer Platform). RUNTIME-only: it drives a
Server Wallet v2 (private keys in Coinbase's TEE; the caller holds an API key + wallet secret that
live in dot-local — never shared temp, never published), the Trade API (DEX aggregator), and Spend
Permissions (a per-period allowance that is a circuit-breaker INDEPENDENT of ark's RiskGate).

Testnet-first: a mainnet trade requires the human-approved live gate (the same staged escalation as
fiat live capital). Raises offline (no credentials).
"""

_MAINNETS = {"base-mainnet", "ethereum", "polygon", "arbitrum", "optimism"}


class CDPAdapter:
    name = "cdp"
    kind = "onchain"

    def __init__(self, network="base-sepolia"):
        self.network = network

    def describe(self):
        return {"name": self.name, "kind": self.kind, "network": self.network,
                "capabilities": ["server-wallet-v2", "trade-api", "spend-permissions", "x402"]}

    def assert_trade_allowed(self, network, escalation_approved=False):
        """Testnet-gate: a mainnet trade needs the explicit human-approved live gate."""
        if network in _MAINNETS and not escalation_approved:
            raise PermissionError("CDP testnet-gate: a mainnet trade requires the human-approved live "
                                  "gate (staged escalation testnet -> small mainnet)")
        return True

    def trade(self, from_asset, to_asset, amount, escalation_approved=False):
        self.assert_trade_allowed(self.network, escalation_approved)
        raise RuntimeError("CDPAdapter needs a funded Server Wallet (dot-local creds, testnet-first)")
