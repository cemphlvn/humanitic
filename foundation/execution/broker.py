"""
broker — the broker-adapter layer + partner execution PROFILES.

The same strategy is back-tested ACROSS profiles (each models a supported partner's fills) to measure
the deployment gap *across partners*: a strategy that survives every profile is execution-robust; one
that only works on ideal fills is fragile. Real broker adapters (Alpaca / IBKR) are RUNTIME-ONLY —
they connect to live/paper APIs with credentials; offline we model their execution with a PaperBroker
profile (slippage + partial-fill characteristics).
"""
from dataclasses import dataclass
from foundation.execution.paper import PaperBroker


@dataclass
class BrokerProfile:
    name: str
    slippage_bps: float
    partial_prob: float
    kind: str = "paper"                       # paper | live-modeled


# each profile models a SUPPORTED PARTNER's execution characteristics
PROFILES = {
    "paper-ideal":    BrokerProfile("paper-ideal",     1.0, 0.00),
    "alpaca-paper":   BrokerProfile("alpaca-paper",    5.0, 0.10),
    "ibkr-modeled":   BrokerProfile("ibkr-modeled",    3.0, 0.05),
    "retail-adverse": BrokerProfile("retail-adverse", 10.0, 0.20),
}


def make_broker(profile, rng):
    p = PROFILES[profile] if isinstance(profile, str) else profile
    return PaperBroker(slippage_bps=p.slippage_bps, partial_prob=p.partial_prob, rng=rng)


class _RuntimeAdapter:
    """A live/paper broker adapter — needs API credentials; never executes offline."""
    name = "runtime-broker"

    def __init__(self, *a, **k):
        pass

    def step(self, *a, **k):
        raise RuntimeError("%s is a runtime broker adapter — needs live/paper API credentials and an "
                           "explicit human-approved live gate" % self.name)


class AlpacaAdapter(_RuntimeAdapter):
    name = "alpaca"


class IBKRAdapter(_RuntimeAdapter):
    name = "ibkr"
