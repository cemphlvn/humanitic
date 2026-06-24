"""The first-meaningful-result harness: a planted LEAD edge clears every gate (and its shuffled noise
control comes back NOT MEANINGFUL); pure noise is rejected; and mining 500 trials deflates the SAME edge —
the multiple-testing haircut. A verdict that can't be lowered by mining isn't honest."""
import numpy as np

from foundation.eval import verdict


def run():
    rng = np.random.default_rng(0)
    n = 800

    # (1) PLANTED LEAD edge: the signal z LEADS the next-bar return by 1 -> fwd[t] = coef*z[t-1] + noise.
    # The lead structure is what the causality test is built to catch; z is PERSISTENT (AR(1)) so the
    # court — which trades the same-bar pair — also sees the edge through the signal's own autocorrelation.
    z = np.empty(n)
    z[0] = rng.normal()
    for t in range(1, n):
        z[t] = 0.6 * z[t - 1] + rng.normal(0, 0.8)
    fwd = np.empty(n)
    fwd[0] = rng.normal(0, 0.05)
    fwd[1:] = 0.015 * z[:-1] + rng.normal(0, 0.05, n - 1)
    res = verdict.measure(z, fwd, n_trials=1)
    assert res["verdict"] == "MEANINGFUL", res
    assert res["noise_control"] == "NOT MEANINGFUL", res
    assert res["granger"]["causes"] is True, res
    assert res["court_verdict"] == "MEANINGFUL", res

    # (2) PURE NOISE: returns independent of z -> the court can say no.
    noise = rng.normal(0, 0.05, n)
    null = verdict.measure(z, noise, n_trials=1)
    assert null["verdict"] == "NOT MEANINGFUL", null

    # (3) MULTIPLE TESTING: the SAME planted edge mined across 500 trials deflates the Sharpe. The DSR must
    # be strictly lower than at n_trials=1, and the haircut flips the verdict to NOT MEANINGFUL.
    mined = verdict.measure(z, fwd, n_trials=500)
    assert mined["deflated_sharpe"] < res["deflated_sharpe"], (mined, res)
    assert mined["verdict"] == "NOT MEANINGFUL", mined

    print("test_verdict: OK (planted lead edge -> MEANINGFUL, noise control says no, granger causes; "
          "pure noise -> NOT MEANINGFUL; 500 trials deflate DSR %.3f->%.3f and flip the verdict)"
          % (res["deflated_sharpe"], mined["deflated_sharpe"]))
    return True


if __name__ == "__main__":
    run()
