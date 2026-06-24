"""
cross_broker — backtest a strategy ACROSS broker profiles. The deployment gap *across supported
partners*: run the same strategy through each partner's modeled execution, then read the equity
SPREAD (execution risk) and whether the strategy survived every partner's fills (robust). A strategy
that only lives on ideal fills is fragile; one that survives the adverse profile is execution-robust.
"""
import numpy as np
from foundation.execution.broker import make_broker, PROFILES
from foundation.operator.autonomous import paper_session, RiskConfig


def backtest_across(prices, strategy, profiles=None, seed=0, risk=None):
    profiles = profiles or list(PROFILES.keys())
    risk = risk or RiskConfig()
    rows = []
    for i, prof in enumerate(profiles):
        broker = make_broker(prof, np.random.default_rng(seed + i))
        rep = paper_session(prices, strategy, np.random.default_rng(seed + i), risk, broker=broker)
        rep["broker"] = prof if isinstance(prof, str) else prof.name
        rows.append(rep)
    eqs = [r["final_equity"] for r in rows]
    return {"per_broker": rows,
            "equity_spread": float(max(eqs) - min(eqs)),          # deployment gap across partners
            "robust": all(r["halted"] is None for r in rows)}     # survived every partner's fills?
