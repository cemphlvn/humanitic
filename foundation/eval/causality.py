"""
causality — time-series causality, numpy-only.

`granger_causality(x, y)` asks: does x Granger-cause y — i.e. does the past of x improve the prediction of
y beyond y's OWN past? It fits a restricted model (y on its own lags) and an unrestricted one (y on its own
+ x's lags) and compares fit. The p-value is a MIN-SHIFT permutation null on x (circular shifts longer than
the autocorrelation length), so we never need the F-distribution CDF and we stay honest about serial
correlation. Causality is necessary-not-sufficient for an edge; it screens out pure contemporaneous
correlation and helps separate a real lead from a shared seasonal driver.
"""
import numpy as np


def _ols_rss(X, y):
    b = np.linalg.lstsq(X, y, rcond=None)[0]
    r = y - X @ b
    return float(r @ r)


def _granger_F(x, y, lags):
    n = len(y)
    rows = n - lags
    Yt = y[lags:]
    Ly = np.column_stack([y[lags - l - 1:n - l - 1] for l in range(lags)])
    Lx = np.column_stack([x[lags - l - 1:n - l - 1] for l in range(lags)])
    Xr = np.column_stack([np.ones(rows), Ly])                 # restricted: own lags only
    Xu = np.column_stack([np.ones(rows), Ly, Lx])             # unrestricted: + x's lags
    rss_r, rss_u = _ols_rss(Xr, Yt), _ols_rss(Xu, Yt)
    df2 = rows - Xu.shape[1]
    return ((rss_r - rss_u) / lags) / ((rss_u / df2) + 1e-18)


def granger_causality(x, y, lags=3, B=500, seed=0, alpha=0.05):
    """Does x Granger-cause y? F-stat + a min-shift permutation p-value (serial-correlation-honest)."""
    x = np.asarray(x, float)
    y = np.asarray(y, float)
    n = len(y)
    obs = _granger_F(x, y, lags)
    rng = np.random.default_rng(seed)
    lo = max(1, n // 8)
    null = np.array([_granger_F(np.roll(x, int(rng.integers(lo, n - lo))), y, lags) for _ in range(B)])
    p = float((np.sum(null >= obs) + 1) / (B + 1))
    return {"f_stat": round(float(obs), 3), "p_value": round(p, 4), "lags": lags, "causes": bool(p < alpha)}
