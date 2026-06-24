"""
interval_fit — find the TIME-INTERVAL-INFRA-FIT.

Run the paper strategy across multiple bar intervals (rebalance horizons), measure performance per
interval, and pick the best — but judged by the DEFLATED Sharpe with n_trials = the number of FEASIBLE
intervals tried, so we don't fool ourselves by selecting the best of many. Each interval carries an
INFRA-FEASIBILITY verdict: an interval below the data cadence can't be traded, and one so coarse there are
too few bars has no statistical power. The fit is performance AND feasibility.
"""
import numpy as np

from foundation.eval import significance
from foundation.execution.paper_account import PaperAccount


def resample(signal, returns, k):
    """Aggregate to interval k: returns summed over k-bar blocks; signal = the block-START value (causal)."""
    n = (len(returns) // k) * k
    r = np.asarray(returns[:n], float).reshape(-1, k).sum(1)
    s = np.asarray(signal[:n], float).reshape(-1, k)[:, 0]
    return s, r


def fit(signal, returns, intervals=(1, 2, 4, 8, 16, 32), min_cadence=1, min_bars=30,
        equity0=100_000.0, sr_variance=0.01):
    rows = []
    for k in intervals:
        if k < min_cadence:
            rows.append({"interval": k, "feasible": False, "reason": "below data cadence"})
            continue
        s, r = resample(signal, returns, k)
        if len(r) < min_bars:
            rows.append({"interval": k, "feasible": False, "reason": "too few bars", "n_bars": len(r)})
            continue
        w = (s - s.mean()) / (s.std() + 1e-12)
        pnl = w * r
        sharpe = float(pnl.mean() / (pnl.std() + 1e-12))
        summ = PaperAccount(equity0).run(np.clip(w, -1, 1), r)
        rows.append({"interval": k, "feasible": True, "n_bars": len(r), "sharpe": round(sharpe, 4),
                     "total_return": summ["total_return"], "max_drawdown": summ["max_drawdown"]})

    n_trials = sum(1 for x in rows if x.get("feasible"))                  # the multiple-testing count
    for x in rows:
        if x.get("feasible"):
            d = significance.deflated_sharpe(x["sharpe"], n_trials=n_trials, n_obs=x["n_bars"], sr_variance=sr_variance)
            x["deflated_sharpe"] = d["deflated_sharpe"]
            x["skilled"] = d["skilled"]

    cand = [x for x in rows if x.get("feasible") and x.get("skilled")]
    best = max(cand, key=lambda x: x["deflated_sharpe"]) if cand else None
    return {"intervals": rows, "best_fit": best, "n_trials": n_trials,
            "note": "best chosen by Deflated Sharpe (n_trials = #feasible intervals) — survives "
                    "multiple-interval selection; feasibility = cadence + enough bars (the infra fit)"}
