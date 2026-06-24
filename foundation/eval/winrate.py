"""
winrate — win statistics, done honestly. A hit rate is meaningless without the PAYOFF ratio, so we always
report both, plus expectancy, the BREAKEVEN win rate, profit factor, and the STATISTICAL SIGNIFICANCE of
the hit rate (a binomial test vs breakeven + a Wilson confidence interval). For a continuous-position
strategy the unit is the bar (hit rate = % positive bars), not a discrete trade.

The key identity: hit_rate > breakeven_win_rate  ⟺  expectancy > 0 (where breakeven = 1/(1+payoff)). A
high hit rate with a poor payoff is NOT an edge — and the binomial test vs breakeven says so.
"""
import math

import numpy as np


def _norm_cdf(x):
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def win_metrics(pnl):
    p = np.asarray(pnl, float)
    p = p[p != 0.0]                                            # drop exact scratches
    n = len(p)
    if n == 0:
        return {"n": 0, "wins": 0, "losses": 0, "hit_rate": 0.0, "avg_win": 0.0, "avg_loss": 0.0,
                "payoff_ratio": None, "expectancy": 0.0, "breakeven_win_rate": 1.0, "profit_factor": None}
    wins, losses = p[p > 0], p[p < 0]
    avg_win = float(wins.mean()) if len(wins) else 0.0
    avg_loss = float(-losses.mean()) if len(losses) else 0.0
    payoff = (avg_win / avg_loss) if avg_loss > 0 else math.inf
    if not math.isfinite(payoff):
        breakeven = 0.0
    elif payoff == 0.0:
        breakeven = 1.0
    else:
        breakeven = 1.0 / (1.0 + payoff)
    pf = (float(wins.sum()) / float(-losses.sum())) if (len(losses) and losses.sum() < 0) else math.inf
    return {"n": n, "wins": int(len(wins)), "losses": int(len(losses)),
            "hit_rate": round(len(wins) / n, 4), "avg_win": round(avg_win, 6), "avg_loss": round(avg_loss, 6),
            "payoff_ratio": round(payoff, 4) if math.isfinite(payoff) else None,
            "expectancy": round(float(p.mean()), 6), "breakeven_win_rate": round(breakeven, 4),
            "profit_factor": round(pf, 4) if math.isfinite(pf) else None}


def wilson_interval(k, n, z=1.96):
    """Wilson score CI for a proportion k/n (robust for small n / extreme p, unlike the normal approx)."""
    if n == 0:
        return (0.0, 0.0)
    phat = k / n
    denom = 1 + z * z / n
    center = (phat + z * z / (2 * n)) / denom
    half = z * math.sqrt(phat * (1 - phat) / n + z * z / (4 * n * n)) / denom
    return (max(0.0, center - half), min(1.0, center + half))


def hit_rate_significance(pnl, alpha=0.05):
    """Win metrics + is the hit rate significantly above its BREAKEVEN (given the payoff)? Binomial test
    (normal approx, continuity-corrected) + Wilson CI. hit_rate > breakeven  ⟺  expectancy > 0."""
    wm = win_metrics(pnl)
    n, k, be = wm["n"], wm["wins"], wm["breakeven_win_rate"]
    if n == 0:
        return {**wm, "wilson_ci": [0.0, 0.0], "p_value_vs_breakeven": 1.0, "beats_breakeven": False}
    phat = k / n
    be_c = min(max(be, 1e-6), 1 - 1e-6)
    se = math.sqrt(be_c * (1 - be_c) / n)
    z = (phat - be_c - 0.5 / n) / se                          # one-sided, continuity-corrected
    p_value = 1.0 - _norm_cdf(z)
    lo, hi = wilson_interval(k, n)
    return {**wm, "wilson_ci": [round(lo, 4), round(hi, 4)], "p_value_vs_breakeven": round(p_value, 4),
            "beats_breakeven": bool(phat > be and p_value < alpha)}
