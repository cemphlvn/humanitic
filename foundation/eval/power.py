"""
power — statistical POWER analysis for an edge, BEFORE you spend data deciding.

The honest question this module answers: given a target Information Coefficient (IC), how many trials
the search burned (multiple-testing), and a desired significance/power, how many observations do you
need to DETECT the edge — and, decisively, whether it is detectable AT ALL once the Deflated-Sharpe
multiple-testing haircut is paid.

WHY this lives upstream of the court (significance.py): you must know how much data a verdict needs
BEFORE you collect it, or you will conclude an edge from noise (a t-stat clears 1.96 at small N for a
nothing strategy). And — the most important honest output — some edges are simply UNDETECTABLE under
the haircut no matter how much data you gather: once you mine `n_trials` signals, the expected MAX
Sharpe under the null (`sr0`, the same expected-max-Sharpe López de Prado deflates by in
significance.deflated_sharpe) can exceed the true edge itself. When `IC <= sr0` there is NO sample
size that suffices; `feasible=False` is an honest stop, not a failure to compute.

The model
---------
A zscore/sign strategy on a signal with Information Coefficient `IC` has per-period Sharpe ≈ IC.
To clear the Deflated-Sharpe court at significance `alpha`, the OBSERVED Sharpe must exceed the
multiple-testing floor `sr0` by `z_alpha/√(N-1)` (the standard error of a Sharpe estimate is ≈
1/√(N-1) once deflated by the expected-max-under-null). For statistical POWER `1-beta` when the TRUE
IC equals the target (Sharpe-estimate se ≈ 1/√N), the required sample size is

    N ≈ ((z_alpha + z_beta) / (IC - sr0))² + 1     (z_alpha = Φ⁻¹(1-alpha), z_beta = Φ⁻¹(power))

and it is INFEASIBLE — no amount of data suffices — when `IC <= sr0`, because the multiple-testing
floor already swallows the edge. `sr0` itself comes from the trial count exactly as in the deflated
Sharpe (Euler-Mascheroni γ): more trials -> larger sr0 -> larger N (or infeasible).
"""
import math

from foundation.eval.significance import _norm_cdf, _norm_ppf   # reuse the same inverse/forward normal CDF


def expected_max_sharpe(n_trials, sr_variance=0.01):
    """Expected MAX Sharpe under the null given `n_trials` independent looks — the multiple-testing floor
    `sr0` that the Deflated Sharpe deflates by (matches significance.deflated_sharpe exactly). 0.0 for a
    single trial: with no multiple testing there is no floor to clear."""
    g, e = 0.5772156649015329, math.e                          # Euler-Mascheroni γ
    if n_trials <= 1:
        return 0.0
    z1, z2 = _norm_ppf(1 - 1.0 / n_trials), _norm_ppf(1 - 1.0 / (n_trials * e))
    return math.sqrt(max(sr_variance, 1e-12)) * ((1 - g) * z1 + g * z2)


def observations_needed(target_ic, n_trials, sr_variance=0.01, alpha=0.05, power=0.80,
                        periods_per_year=None):
    """How many observations to DETECT a per-period edge of `target_ic` at significance `alpha` and power
    `1-beta`, once the `n_trials` multiple-testing floor `sr0` is paid. Returns feasible=False (no N
    suffices) when the edge sits below the floor — the honest stop. With `periods_per_year` it also reports
    the edge in calendar units (e.g. years if periods_per_year=252)."""
    sr0 = expected_max_sharpe(n_trials, sr_variance)
    if target_ic <= sr0:
        return {"feasible": False, "reason": "edge below the multiple-testing floor",
                "target_ic": target_ic, "sr0": round(sr0, 4), "n_needed": None}
    z_alpha, z_beta = _norm_ppf(1 - alpha), _norm_ppf(power)
    n_needed = int(math.ceil(((z_alpha + z_beta) / (target_ic - sr0)) ** 2 + 1))
    out = {"feasible": True, "target_ic": target_ic, "sr0": round(sr0, 4), "n_needed": n_needed,
           "z_alpha": round(z_alpha, 3), "z_beta": round(z_beta, 3)}
    if periods_per_year is not None:
        out["calendar_periods"] = round(n_needed / periods_per_year, 2)
    return out


def detectable_ic(n_obs, n_trials, sr_variance=0.01, alpha=0.05, power=0.80):
    """The inverse of observations_needed: with `n_obs` observations and `n_trials` looks, the SMALLEST IC
    you could detect at the given significance/power. min_ic = sr0 + (z_alpha+z_beta)/√(N-1) — below it the
    edge is indistinguishable from the multiple-testing floor at this sample size."""
    sr0 = expected_max_sharpe(n_trials, sr_variance)
    z_alpha, z_beta = _norm_ppf(1 - alpha), _norm_ppf(power)
    min_ic = sr0 + (z_alpha + z_beta) / math.sqrt(max(n_obs - 1, 1))
    return {"n_obs": n_obs, "sr0": round(sr0, 4), "min_detectable_ic": round(min_ic, 4)}
