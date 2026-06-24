"""
Walk-forward backtest engine. Causal by construction: w_t uses only prices[:t+1], returns
realize on t+1, costs charged on turnover. Reports IN-SAMPLE vs OUT-OF-SAMPLE separately,
because only OOS counts. REFUSES to run a strategy that fails the leakage guard — the court
will not score a cheat.
"""
import numpy as np
from foundation.backtest.fees_slippage import cost
from foundation.backtest.leakage_guard import assert_no_leak
from foundation.spine import conservation as C


def _metrics(rets):
    rets = np.asarray(rets, float)
    if len(rets) == 0:
        return {"n": 0, "total_return": 0.0, "sharpe": 0.0, "max_dd": 0.0}
    equity = np.cumprod(1.0 + rets)
    peak = np.maximum.accumulate(equity)
    dd = (equity - peak) / peak
    sharpe = float(np.mean(rets) / (np.std(rets) + 1e-12) * np.sqrt(252))
    return {"n": int(len(rets)), "total_return": float(equity[-1] - 1.0),
            "sharpe": sharpe, "max_dd": float(dd.min())}


def walk_forward(prices, strategy, rng, cost_bps=5.0, oos_frac=0.5, warmup=25, D=4096):
    prices = np.asarray(prices, float)
    assert_no_leak(strategy, prices, rng)             # ETHICAL GATE: peekers do not run
    T = len(prices)
    oos_start = int(T * (1 - oos_frac))
    prev_w, rets, ts, ws, ras = 0.0, [], [], [], []
    for t in range(warmup, T - 1):
        w = float(strategy.target_weight(prices, t))
        r_asset = prices[t + 1] / prices[t] - 1.0
        rets.append(w * r_asset - cost(prev_w, w, cost_bps))
        ts.append(t); ws.append(w); ras.append(r_asset)
        prev_w = w
    ts, rets, ws, ras = (np.array(x) for x in (ts, rets, ws, ras))
    is_m, oos_m = ts < oos_start, ts >= oos_start

    # edge in BITS, against the capacity ceiling C(D) — the court will NOT claim past the wall
    edge = {"in_sample": C.directional_edge(ws[is_m], ras[is_m], D),
            "oos": C.directional_edge(ws[oos_m], ras[oos_m], D),
            "capacity_bits": C.capacity(D)}
    edge["claimed_oos_bits"] = min(edge["oos"]["held_bits"], edge["capacity_bits"])
    edge["capacity_exceeded"] = edge["oos"]["held_bits"] > edge["capacity_bits"]
    isb = edge["in_sample"]["held_bits"]
    edge["oos_bit_retention"] = float(edge["oos"]["held_bits"] / isb) if isb > 1e-9 else 0.0

    return {"all": _metrics(rets),
            "in_sample": _metrics(rets[is_m]),
            "oos": _metrics(rets[oos_m]),
            "edge": edge,
            "equity": np.cumprod(1.0 + rets)}
