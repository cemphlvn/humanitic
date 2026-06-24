"""Unsupervised dynamic trading + time-series causality: a real planted edge is found & causal; noise isn't."""
import numpy as np

from foundation.regime import unsupervised as U
from foundation.eval import significance as sig
from foundation.eval import causality as ca


def run():
    # a world with a REAL planted regime edge (regime at t -> return at t+1): discover regimes (no
    # labels), trade them 1-step-ahead, and demand BOTH the court and Granger causality
    feat, fwd, _ = U.synth_regime_world(n=1000, seed=0)
    pos, r, atoms = U.dynamic_trade(feat, fwd, k=3, seed=0)
    assert sig.court(pos, r, seed=1)["verdict"] == "MEANINGFUL"
    assert ca.granger_causality(feat[:, 0], fwd, lags=3, seed=1)["causes"]
    assert len(atoms["regime_return"]) == 3

    # a noise world: returns independent of the regime -> nothing to find, and nothing causal
    rng = np.random.default_rng(5)
    feat_n, _, _ = U.synth_regime_world(n=1000, seed=1)
    fwd_n = rng.normal(0, 0.01, 1000)
    pos_n, r_n, _ = U.dynamic_trade(feat_n, fwd_n, k=3, seed=0)
    assert sig.court(pos_n, r_n, seed=1)["verdict"] == "NOT MEANINGFUL"
    assert not ca.granger_causality(feat_n[:, 0], fwd_n, lags=3, seed=1)["causes"]

    print("test_unsupervised: OK (discovered regimes trade a real edge -> MEANINGFUL + Granger-causal; "
          "noise -> neither)")
    return True


if __name__ == "__main__":
    run()
