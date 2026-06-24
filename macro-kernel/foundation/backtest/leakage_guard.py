"""
Leakage guard — the look-ahead detector. Model-agnostic, empirical, refutation-first.

A strategy MUST compute w_t from prices[:t+1] only. We PROVE it by trying to break it:
corrupt the FUTURE (prices[t+1:]) with garbage and re-ask for w_t. If w_t changes, the
strategy peeked -> LEAK. If invariant across many probes, it is clean. We try to break
the strategy, exactly as the LABNOTES tries to refute its own claims.
"""
import numpy as np


def detect_leak(strategy, prices, rng, n_probes=32, warmup=25):
    prices = np.asarray(prices, dtype=float)
    T = len(prices)
    hi = T - 1
    if hi <= warmup:
        return {"leak": False, "probes": 0}
    ts = rng.integers(warmup, hi, size=min(n_probes, hi - warmup))
    for t in ts:
        t = int(t)
        w_true = float(strategy.target_weight(prices, t))
        corrupt = prices.copy()
        corrupt[t + 1:] = prices[t] * np.exp(rng.normal(0, 0.1, T - t - 1))  # garbage future
        w_corrupt = float(strategy.target_weight(corrupt, t))
        if abs(w_true - w_corrupt) > 1e-9:
            return {"leak": True, "t": t, "w_true": w_true, "w_corrupt": w_corrupt}
    return {"leak": False, "probes": int(len(ts))}


def assert_no_leak(strategy, prices, rng):
    rep = detect_leak(strategy, prices, rng)
    if rep["leak"]:
        raise AssertionError(
            f"LOOK-AHEAD LEAK at t={rep['t']}: w={rep['w_true']:.4f} -> "
            f"{rep['w_corrupt']:.4f} when the future was corrupted")
    return True
