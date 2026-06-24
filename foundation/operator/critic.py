"""
critic — the AGENT-CRITIC / deployment-gap audit (Exp 4).

A deterministic critic that audits a StrategyObject for the hazards that make a beautiful
backtest LIE in live trading. Same shape as a NeMo Data Designer validator: each check is an
isolated, refutation-first probe that returns pass/flag with a legible detail string. The
audit never trusts; it tries to BREAK the strategy, then reports what it found.

The deployment gap (why a backtest lies live), one check per hazard:
  1. look_ahead          — the strategy peeks at the future (the leakage guard's teeth).
  2. slippage_realism    — costs assumed too optimistic to survive a real fill.
  3. position_concentration — gross exposure beyond the declared risk budget.
  4. turnover_explosion  — churn so high the modeled costs would devour the edge live.
  5. regime_brittleness  — no real OOS edge; the backtest overfit in-sample.
  6. survivorship        — the universe is not declared point-in-time (survivorship bias).

Legibility contract: one function = one check. A check that raises is caught to status
"error" — a broken probe must NEVER crash the audit. verdict = FLAGGED if any check flags.

Offline, numpy only. Reuses the real evidence-court APIs; invents no new market machinery.
"""
import numpy as np

from foundation.backtest.leakage_guard import detect_leak
from foundation.backtest.walk_forward import walk_forward


def _check_look_ahead(strategy, prices, rng):
    """Refute causality: corrupt the future, re-ask for w_t. If it moves, the strategy peeked."""
    rep = detect_leak(strategy, prices, rng)
    if rep.get("leak"):
        return {"name": "look_ahead", "status": "flag",
                "detail": "look-ahead leak: w_t changed when the future was corrupted"}
    return {"name": "look_ahead", "status": "pass",
            "detail": "no leak over %d probes" % int(rep.get("probes", 0))}


def _check_slippage_realism(cost_bps, min_cost_bps):
    """The cheapest way to fake a backtest is to assume costs that no real fill would honor."""
    if cost_bps < min_cost_bps:
        return {"name": "slippage_realism", "status": "flag",
                "detail": "cost_bps=%.2f below realism floor %.2f bps" % (cost_bps, min_cost_bps)}
    return {"name": "slippage_realism", "status": "pass",
            "detail": "cost_bps=%.2f >= floor %.2f bps" % (cost_bps, min_cost_bps)}


def _path_weights(strategy, prices, warmup):
    """The realized weight path w_t over the auditable window [warmup, T-1]. Causal by contract."""
    T = len(prices)
    lo = min(warmup, max(T - 1, 0))
    return np.array([float(strategy.target_weight(prices, t)) for t in range(lo, T - 1)])


def _check_position_concentration(weights, max_gross):
    """Gross exposure ceiling: max |w_t| over the path must respect the declared risk budget."""
    if len(weights) == 0:
        return {"name": "position_concentration", "status": "pass",
                "detail": "no weights to inspect"}
    peak = float(np.max(np.abs(weights)))
    if peak > max_gross:
        return {"name": "position_concentration", "status": "flag",
                "detail": "max |w|=%.4f exceeds max_gross=%.4f" % (peak, max_gross)}
    return {"name": "position_concentration", "status": "pass",
            "detail": "max |w|=%.4f within max_gross=%.4f" % (peak, max_gross)}


def _check_turnover_explosion(weights, max_turnover):
    """Mean |w_t - w_{t-1}| over the path. Explosive churn lets live costs devour the edge."""
    if len(weights) < 2:
        return {"name": "turnover_explosion", "status": "pass",
                "detail": "path too short to measure turnover"}
    mean_to = float(np.mean(np.abs(np.diff(weights))))
    if mean_to > max_turnover:
        return {"name": "turnover_explosion", "status": "flag",
                "detail": "mean turnover=%.4f exceeds max_turnover=%.4f" % (mean_to, max_turnover)}
    return {"name": "turnover_explosion", "status": "pass",
            "detail": "mean turnover=%.4f within max_turnover=%.4f" % (mean_to, max_turnover)}


def _check_regime_brittleness(strategy, prices, rng, cost_bps, min_retention, leaky):
    """OOS reality: does the edge survive walk-forward, or did it overfit in-sample?

    Skipped if leaky — walk_forward REFUSES a peeker, so there is nothing honest to score."""
    if leaky:
        return {"name": "regime_brittleness", "status": "skip", "detail": "leaky"}
    res = walk_forward(prices, strategy, rng, cost_bps=cost_bps)
    retention = float(res["edge"]["oos_bit_retention"])
    excess = float(res["edge"]["oos"]["excess_bits"])
    if retention < min_retention or excess <= 0.0:
        return {"name": "regime_brittleness", "status": "flag",
                "detail": "brittle OOS: bit_retention=%.3f (min %.3f), excess_bits=%.3f"
                          % (retention, min_retention, excess)}
    return {"name": "regime_brittleness", "status": "pass",
            "detail": "OOS holds: bit_retention=%.3f, excess_bits=%.3f" % (retention, excess)}


def _check_survivorship(point_in_time):
    """Config-driven honesty: an undeclared universe is presumed survivorship-biased until proven."""
    if point_in_time:
        return {"name": "survivorship", "status": "pass",
                "detail": "universe declared point-in-time"}
    return {"name": "survivorship", "status": "flag",
            "detail": "universe not declared point-in-time"}


def audit(strategy, prices, rng, cost_bps=5.0, max_gross=0.5, max_turnover=1.0,
          min_cost_bps=2.0, min_retention=0.2, warmup=25, point_in_time=False):
    """
    Audit a strategy for the deployment gap. Returns a legible report:
      {"verdict": "CLEAN"|"FLAGGED", "checks": [{"name","status","detail"}, ...]}

    Each check is isolated and wrapped: a check that RAISES becomes status "error", never a
    crash — a broken probe must not silence the audit. The look-ahead check runs FIRST; if it
    flags, the backtest-dependent checks are skipped (status "skip", detail "leaky"), because
    the court will not score a cheat.
    """
    prices = np.asarray(prices, dtype=float)
    checks = []

    def _run(fn, name):
        """Isolation wrapper: a raising check is recorded as 'error', the audit goes on."""
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001 — a broken probe must not crash the audit
            return {"name": name, "status": "error", "detail": "%s: %s" % (type(exc).__name__, exc)}

    # 1. look_ahead FIRST — its result gates the backtest-dependent checks below.
    look = _run(lambda: _check_look_ahead(strategy, prices, rng), "look_ahead")
    checks.append(look)
    leaky = look["status"] == "flag"

    # 2. slippage realism — pure config, independent of the price path.
    checks.append(_run(lambda: _check_slippage_realism(cost_bps, min_cost_bps), "slippage_realism"))

    # 3 & 4 share one realized weight path (compute once, both probe it).
    weights = _run(lambda: _path_weights(strategy, prices, warmup), "_path")
    if isinstance(weights, dict):  # the path itself raised -> propagate as errors to both checks
        checks.append({"name": "position_concentration", "status": "error",
                       "detail": weights["detail"]})
        checks.append({"name": "turnover_explosion", "status": "error", "detail": weights["detail"]})
    else:
        checks.append(_run(lambda: _check_position_concentration(weights, max_gross),
                           "position_concentration"))
        checks.append(_run(lambda: _check_turnover_explosion(weights, max_turnover),
                           "turnover_explosion"))

    # 5. regime brittleness — skipped if leaky (the court refuses a peeker).
    checks.append(_run(
        lambda: _check_regime_brittleness(strategy, prices, rng, cost_bps, min_retention, leaky),
        "regime_brittleness"))

    # 6. survivorship — config-driven; unproven universe => flagged (honest default).
    checks.append(_run(lambda: _check_survivorship(point_in_time), "survivorship"))

    verdict = "FLAGGED" if any(c["status"] == "flag" for c in checks) else "CLEAN"
    return {"verdict": verdict, "checks": checks}
