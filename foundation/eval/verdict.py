"""
verdict — the FIRST-MEANINGFUL-RESULT harness. This is the MEASUREMENT, not a backtest knob.

Given one (signal, forward-return) pair, we run the PRE-REGISTERED battery of statistical tests ONCE, at
the pre-registered N, and return ONE honest verdict bundle. No peeking, no re-running until it passes — a
verdict you can tune is not a verdict. We do not reinvent the stats; we COMPOSE the existing court
(`significance.court`), the multiple-testing haircut (`significance.deflated_sharpe`), and the lead test
(`causality.granger_causality`).

Honesty contract — `verdict == "MEANINGFUL"` requires ALL of:
  • the court returns MEANINGFUL (positive growth, permutation p<α, significant t, bootstrap p<α);
  • x Granger-causes the return (a real LEAD, not a contemporaneous accident);
  • the Deflated Sharpe clears a hard 0.95 floor (multiple-testing-honest given n_trials);
  • the win rate beats its breakeven (hit_rate > breakeven ⟺ positive expectancy);
  • AND the SHUFFLED noise control comes back NOT MEANINGFUL. A test that cannot say no is worthless, so
    we permute the returns, re-run the SAME court, and demand it reject the broken-link version.

Note: with n_trials=1 the Deflated Sharpe floor sr0=0, so the DSR is just the multiple-testing-honest
significance of the Sharpe itself; raise n_trials and the floor deflates it by the expected max Sharpe
under the null — the haircut for having mined many signals.
"""
import numpy as np

from foundation.eval import causality, significance


def residualize(y, factor):
    """OLS residual of y on [1, factor] (Frisch-Waugh): the part of y NOT explained by the factor. Used to
    strip a common SECTOR driver (e.g. TTN LoRaWAN activity) so the verdict measures edge NET of sector beta."""
    y = np.asarray(y, float)
    f = np.asarray(factor, float)
    n = min(len(y), len(f))
    y, f = y[:n], f[:n]
    X = np.column_stack([np.ones(n), f])
    b = np.linalg.lstsq(X, y, rcond=None)[0]
    return y - X @ b


def measure(signal, fwd_returns, n_trials=1, alpha=0.05, sr_variance=0.01, lags=3, seed=0, control=None):
    """Run the pre-registered battery ONCE on (signal, fwd_returns) and return one honest verdict bundle.
    If `control` is given (a sector factor, e.g. TTN activity), BOTH the signal and the return are
    residualized against it first — so a verdict of MEANINGFUL is edge BEYOND sector beta, not the sector."""
    s = np.asarray(signal, float)
    r = np.asarray(fwd_returns, float)
    n = min(len(s), len(r))                                    # align to the shorter length
    s, r = s[:n], r[:n]
    if control is not None:                                    # strip the common sector driver from both
        c = np.asarray(control, float)[:n]
        s, r = residualize(s, c), residualize(r, c)

    court = significance.court(s, r, alpha=alpha, seed=seed)   # the three-test growth court
    dsr = significance.deflated_sharpe(court["sharpe"], n_trials=n_trials, n_obs=court["n"],
                                       sr_variance=sr_variance)["deflated_sharpe"]
    gr = causality.granger_causality(s, r, lags=lags, seed=seed)   # does the signal LEAD the return?

    # NOISE CONTROL: break the signal->return link by permuting r, then re-run the SAME court. A real edge
    # must DISAPPEAR here; if the court still says MEANINGFUL on shuffled returns, the court is fooling us.
    ctrl = significance.court(s, np.random.default_rng(seed + 1).permutation(r), alpha=alpha, seed=seed)

    # lead-1 information coefficient: corr(signal_t, return_{t+1}). 0.0 if too short / zero-variance.
    if n >= 3:
        a, b = s[:-1], r[1:]
        if a.std() > 0 and b.std() > 0:
            ic = float(np.corrcoef(a, b)[0, 1])
        else:
            ic = 0.0
    else:
        ic = 0.0

    meaningful = (court["verdict"] == "MEANINGFUL") and gr["causes"] and (dsr >= 0.95) \
        and court["win"]["beats_breakeven"] and (ctrl["verdict"] == "NOT MEANINGFUL")

    return {"n": court["n"], "ic_lead1": round(ic, 4), "sector_controlled": control is not None,
            "granger": {"p_value": gr["p_value"], "causes": gr["causes"]},
            "court_verdict": court["verdict"], "newey_west_t": court["newey_west_t"],
            "permutation_p": court["permutation_p"], "deflated_sharpe": round(dsr, 4),
            "n_trials": n_trials,
            "win": {"hit_rate": court["win"]["hit_rate"], "payoff_ratio": court["win"].get("payoff_ratio"),
                    "beats_breakeven": court["win"]["beats_breakeven"]},
            "noise_control": ctrl["verdict"],
            "verdict": "MEANINGFUL" if meaningful else "NOT MEANINGFUL"}
