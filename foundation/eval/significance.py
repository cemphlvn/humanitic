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
import math

import numpy as np


def _norm_cdf(x):
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def _norm_ppf(p):
    """Inverse normal CDF (Acklam's rational approximation), numpy/scipy-free."""
    a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
         1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
    b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
         6.680131188771972e+01, -1.328068155288572e+01]
    c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
         -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
    d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00]
    plow, phigh = 0.02425, 1 - 0.02425
    if p < plow:
        q = math.sqrt(-2 * math.log(p))
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / \
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    if p > phigh:
        q = math.sqrt(-2 * math.log(1 - p))
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / \
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    q = p - 0.5
    r = q * q
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / \
           (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)


def deflated_sharpe(observed_sr, n_trials, n_obs, sr_variance=1.0, skew=0.0, kurtosis=3.0):
    """Deflated Sharpe Ratio (López de Prado): P(true SR > 0) AFTER accounting for n_trials — the multiple-
    testing haircut. Mine 500 signals and one will look great by luck; the DSR deflates the observed Sharpe
    by the expected MAX Sharpe under the null given the trial count. Returns DSR in [0,1]; 'skilled' = >0.95."""
    g, e = 0.5772156649015329, math.e                          # Euler-Mascheroni
    if n_trials <= 1:
        sr0 = 0.0
    else:
        z1, z2 = _norm_ppf(1 - 1.0 / n_trials), _norm_ppf(1 - 1.0 / (n_trials * e))
        sr0 = math.sqrt(max(sr_variance, 1e-12)) * ((1 - g) * z1 + g * z2)   # expected max SR under null
    denom = math.sqrt(max(1 - skew * observed_sr + (kurtosis - 1) / 4.0 * observed_sr ** 2, 1e-12))
    dsr = _norm_cdf((observed_sr - sr0) * math.sqrt(max(n_obs - 1, 1)) / denom)
    return {"deflated_sharpe": round(dsr, 4), "expected_max_sr_under_null": round(sr0, 4),
            "n_trials": n_trials, "skilled": bool(dsr > 0.95)}


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
