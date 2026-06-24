"""
x402 — agent micropayments (build on x402). An autonomous agent pays PER CALL for data/compute; the
spend is HARD-CAPPED by a session budget so a rogue or looping agent can never drain funds — a
circuit-breaker independent of the broker risk gate. Offline we settle through a deterministic meter;
the runtime settles real USDC (EIP-3009) on Base via CDP's x402 facilitator.

x402 = HTTP 402 revived as machine-native stablecoin pay-per-call (Coinbase Developer Platform).
"""


class PaymentBudget:
    """A per-session x402 spend budget. spend() refuses to exceed it (the payments circuit-breaker)."""
    def __init__(self, budget, facilitator=None):
        self.budget = float(budget)
        self.spent = 0.0
        self.facilitator = facilitator if facilitator is not None else X402Meter()

    def spend(self, amount, resource):
        amount = float(amount)
        if self.spent + amount > self.budget + 1e-12:
            raise PermissionError("x402 budget exceeded: %.4f + %.4f > %.4f"
                                  % (self.spent, amount, self.budget))
        receipt = self.facilitator.settle(amount, resource)
        self.spent += amount
        return receipt

    @property
    def remaining(self):
        return self.budget - self.spent


class X402Meter:
    """Offline x402 settlement — simulated, deterministic, no real funds. Speaks the common language."""
    name = "x402-meter"
    kind = "payments"

    def settle(self, amount, resource):
        return {"settled": float(amount), "resource": resource, "network": "simulated", "status": "ok"}

    def describe(self):
        return {"name": self.name, "kind": self.kind, "capabilities": ["pay-per-call", "budget"]}


class CDPFacilitator:
    """RUNTIME: the CDP x402 facilitator — settles USDC (EIP-3009) on Base/Polygon. Needs a funded
    agent wallet (secrets in dot-local, testnet-first); raises offline."""
    name = "cdp-x402"
    kind = "payments"

    def settle(self, amount, resource):
        raise RuntimeError("CDP x402 facilitator needs a funded agent wallet "
                           "(dot-local wallet secret, testnet-first)")

    def describe(self):
        return {"name": self.name, "kind": self.kind, "capabilities": ["usdc", "eip-3009", "base"]}
