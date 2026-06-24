"""
significance — the statistical court for a CAPITAL GROWTH metric.

Given a signal and the realized next-period returns, build the out-of-sample equity curve and ask: is the
growth RELIABLE and STATISTICALLY MEANINGFUL, or could it arise by chance? Three independent tests — a
real edge should pass all; pure noise should pass none:

  • Newey-West t-stat on mean return (HAC — autocorrelation-robust).
  • Moving-block bootstrap CI + p-value on the Sharpe (preserves serial structure).
  • Permutation test: break the signal->return link (circular shift), build the null, empirical p-value.

Honesty contract: a verdict of MEANINGFUL requires positive OOS growth AND permutation p < α AND a
significant t-stat AND a bootstrap p < α — and the SAME court must return NOT MEANINGFUL on a shuffled
control. A court that cannot say no is worthless.
"""
import numpy as np


def capital_growth(signal, fwd_returns):
    """Position = standardized signal; period return = position · next return. The capital-growth metric is
    the cumulative log growth of that equity curve."""
    s = np.asarray(signal, float)
    r = np.asarray(fwd_returns, float)
    n = min(len(s), len(r))
    s, r = s[:n], r[:n]
    w = (s - s.mean()) / (s.std() + 1e-12)
    pnl = w * r
    log_growth = float(np.sum(np.log1p(np.clip(pnl, -0.99, None))))
    sharpe = float(pnl.mean() / (pnl.std() + 1e-12))
    return {"pnl": pnl, "log_growth": log_growth, "sharpe": sharpe, "n": n}


def newey_west_t(pnl, lags=5):
    """t-stat of mean(pnl) with Newey-West HAC variance (robust to autocorrelation)."""
    x = np.asarray(pnl, float)
    n = len(x)
    if n < 3:
        return 0.0
    mu = x.mean()
    e = x - mu
    s = float(e @ e) / n
    for L in range(1, min(lags, n - 1) + 1):
        s += 2.0 * (1.0 - L / (lags + 1)) * (float(e[L:] @ e[:-L]) / n)
    se = np.sqrt(max(s, 1e-18) / n)
    return float(mu / (se + 1e-18))


def block_bootstrap_sharpe(pnl, block=10, B=1000, seed=0):
    """Moving-block bootstrap of the Sharpe -> (p that Sharpe<=0, 95% CI)."""
    rng = np.random.default_rng(seed)
    x = np.asarray(pnl, float)
    n = len(x)
    block = max(1, min(block, n // 2 or 1))
    nb = int(np.ceil(n / block))
    hi = max(1, n - block + 1)
    sh = np.empty(B)
    for b in range(B):
        samp = np.concatenate([x[s:s + block] for s in rng.integers(0, hi, nb)])[:n]
        sh[b] = samp.mean() / (samp.std() + 1e-12)
    return float(np.mean(sh <= 0.0)), (float(np.percentile(sh, 2.5)), float(np.percentile(sh, 97.5)))


def permutation_pvalue(signal, fwd_returns, B=1000, seed=0):
    """Break the signal->return link by circular shift; empirical p that the mean P&L >= observed under
    the null. Statistic = mean(position · return) ∝ the information coefficient — matching the t-stat
    (total log-growth is a compounding, heavy-tailed statistic and tests the wrong thing)."""
    rng = np.random.default_rng(seed)
    s = np.asarray(signal, float)
    r = np.asarray(fwd_returns, float)
    n = min(len(s), len(r))
    s, r = s[:n], r[:n]
    w = (s - s.mean()) / (s.std() + 1e-12)
    obs = float(np.mean(w * r))
    lo = max(1, n // 8)                       # min shift > autocorrelation length: break serial alignment
    null = np.array([float(np.mean(w * np.roll(r, int(rng.integers(lo, n - lo))))) for _ in range(B)])
    return float((np.sum(null >= obs) + 1) / (B + 1)), obs


def court(signal, fwd_returns, alpha=0.05, seed=0):
    cg = capital_growth(signal, fwd_returns)
    t = newey_west_t(cg["pnl"])
    bp, ci = block_bootstrap_sharpe(cg["pnl"], seed=seed)
    pp, _ = permutation_pvalue(signal, fwd_returns, seed=seed)
    meaningful = (cg["log_growth"] > 0) and (pp < alpha) and (abs(t) > 1.96) and (bp < alpha)
    return {"log_growth": round(cg["log_growth"], 5), "sharpe": round(cg["sharpe"], 4),
            "newey_west_t": round(t, 3), "block_bootstrap_p": round(bp, 4),
            "block_bootstrap_ci": [round(c, 4) for c in ci], "permutation_p": round(pp, 4),
            "n": cg["n"], "alpha": alpha,
            "verdict": "MEANINGFUL" if meaningful else "NOT MEANINGFUL"}
