"""
registry — the HUMANITIK-LICENSED PARTNER REGISTER. The brokers, data providers, and inference
engines the system supports, each registered under the HUMANITIK license: open-core, attribution
required, a 5% foundation cost on rewarded contributions, privacy-respecting (`.local` never leaves).
Registration is REFUSED without a valid HUMANITIK license block. Public only — no `.local`.
"""
from foundation.index.trigram import FOUNDATION_COST          # the 5% foundation cost, single source

HUMANITIK_LICENSE = {
    "scheme": "HUMANITIK",
    "terms": "open-core; attribution required; privacy-respecting (.local never leaves the machine)",
    "foundation_cost": FOUNDATION_COST,                        # 0.05
}


def humanitik_license(attribution):
    return {**HUMANITIK_LICENSE, "attribution": attribution}


def require_humanitik_license(partner):
    lic = partner.get("license", {})
    if lic.get("scheme") != "HUMANITIK" or not lic.get("attribution"):
        raise ValueError("partner %r must carry a HUMANITIK license with attribution"
                         % partner.get("id"))
    return True


class PartnerRegister:
    def __init__(self):
        self._p = {}

    def register(self, partner):
        require_humanitik_license(partner)                     # the gate
        self._p[partner["id"]] = partner
        return partner["id"]

    def list(self, kind=None):
        return [p for p in self._p.values() if kind is None or p["kind"] == kind]

    def get(self, pid):
        return self._p[pid]


_SUPPORTED = [
    {"id": "paper", "kind": "broker", "name": "Built-in Paper", "status": "supported",
     "capabilities": ["paper", "slippage", "partial-fills"],
     "adapter": "foundation.execution.paper.PaperBroker",
     "license": humanitik_license("ark foundation")},
    {"id": "alpaca", "kind": "broker", "name": "Alpaca", "status": "planned",
     "capabilities": ["paper", "live-equities", "fractional"],
     "adapter": "foundation.execution.broker.AlpacaAdapter",
     "license": humanitik_license("Alpaca Markets")},
    {"id": "ibkr", "kind": "broker", "name": "Interactive Brokers", "status": "planned",
     "capabilities": ["paper", "live-multi-asset"],
     "adapter": "foundation.execution.broker.IBKRAdapter",
     "license": humanitik_license("Interactive Brokers")},
    {"id": "stooq", "kind": "data", "name": "Stooq", "status": "planned",
     "capabilities": ["daily-ohlcv", "point-in-time"],
     "adapter": "(runtime)", "license": humanitik_license("Stooq")},
    {"id": "mlx-lm", "kind": "inference", "name": "MLX-LM", "status": "supported",
     "capabilities": ["local", "metal", "openai-compatible"],
     "adapter": "foundation.operator.inference.LocalServerEngine",
     "license": humanitik_license("Apple ml-explore")},
    {"id": "ollama", "kind": "inference", "name": "Ollama", "status": "planned",
     "capabilities": ["local", "openai-compatible", "tool-calling"],
     "adapter": "foundation.operator.inference.LocalServerEngine",
     "license": humanitik_license("Ollama")},
]


def default_register():
    R = PartnerRegister()
    for p in _SUPPORTED:
        R.register(p)
    return R
