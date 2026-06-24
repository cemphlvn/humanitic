"""
trigram_strategy — decode a conceptual TRIGRAM into a runnable, CONSERVATIVELY-sized StrategyObject,
and try a roster of trigram strategies on the evidence court.

Article 0: real strategy IP lives as `.local` trigram substrates the RUNTIME writes; this module
never reads or writes `.local`. FIXTURE_TRIGRAMS below are PUBLIC stand-ins for that private IP, so
the machinery is buildable and testable on the offline floor.

Conservative ratios (best practice = capital preservation first):
  MAX_GROSS = 0.25            quarter-book max exposure; no leverage, no pyramiding
  the risk overlay clips HARD to the trigram's risk level.
"""
import numpy as np
from foundation.kernel.strategy_object import StrategyObject
from foundation.operator.baselines import _past_return
from foundation.backtest.walk_forward import walk_forward

MAX_GROSS = 0.25
_RISK_CAP = {"tight": 0.15, "capped": 0.25, "half": 0.50}      # conservative ladder


def _edge_of(concepts):
    for c in concepts:
        if c.startswith("edge:"):
            return c.split(":", 1)[1]
    return "momentum"


def _cap_of(concepts):
    for c in concepts:
        if c.startswith("risk:"):
            return _RISK_CAP.get(c.split(":", 1)[1], MAX_GROSS)
    return MAX_GROSS


def decode(concepts, k=20):
    """Trigram -> StrategyObject. The edge concept picks the signal; the risk concept the hard cap."""
    edge, cap = _edge_of(concepts), _cap_of(concepts)
    sign = -1.0 if edge == "mean_reversion" else 1.0          # fade vs follow

    def selection(prices, t):
        return 1.0

    def allocation(prices, t, base):
        return base * sign * float(np.sign(_past_return(prices, t, k)))

    def timing(prices, t, w):
        return w

    def risk(prices, t, w):
        return float(np.clip(w, -cap, cap))                   # conservative hard clip

    return StrategyObject(thesis="trigram " + " · ".join(concepts),
                          regime_assumptions=concepts[0] if concepts else "",
                          selection=selection, allocation=allocation, timing=timing, risk=risk)


# PUBLIC fixtures standing in for private .local trigram IP (the runtime supplies the real ones)
FIXTURE_TRIGRAMS = [
    ["regime:trending", "edge:momentum", "risk:capped"],
    ["regime:meanrev", "edge:mean_reversion", "risk:capped"],
    ["regime:trending", "edge:momentum", "risk:tight"],
    ["regime:choppy", "edge:mean_reversion", "risk:tight"],
]


def try_strategies(prices, trigrams, seed=0, cost_bps=5.0):
    """Backtest each trigram strategy conservatively; rank by OOS excess edge-in-bits, then Sharpe."""
    rows = []
    for i, tg in enumerate(trigrams):
        res = walk_forward(prices, decode(tg), np.random.default_rng(seed + i), cost_bps=cost_bps)
        oos, e = res["oos"], res["edge"]["oos"]
        rows.append({"trigram": tg, "oos_sharpe": oos["sharpe"], "oos_return": oos["total_return"],
                     "oos_excess_bits": e["excess_bits"], "oos_held_bits": e["held_bits"],
                     "verdict": "LIVES" if (e["excess_bits"] > 0 and oos["sharpe"] > 0) else "DIES"})
    rows.sort(key=lambda r: (r["oos_excess_bits"], r["oos_sharpe"]), reverse=True)
    return rows
