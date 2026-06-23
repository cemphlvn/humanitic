"""Evidence court: synthetic market, walk-forward with costs, the leakage guard's teeth."""
import numpy as np
from foundation.backtest import synthetic, walk_forward, leakage_guard
from foundation.operator import baselines


def run():
    mkt = synthetic.generate(n_days=800, seed=2)
    assert mkt["prices"].shape == (800,)
    assert set(np.unique(mkt["regime_labels"])).issubset({0, 1, 2})

    mom = baselines.momentum(k=20)
    res = walk_forward.walk_forward(mkt["prices"], mom, np.random.default_rng(1))
    assert res["oos"]["n"] > 0 and np.isfinite(res["oos"]["sharpe"])

    assert leakage_guard.detect_leak(mom, mkt["prices"], np.random.default_rng(4))["leak"] is False
    assert leakage_guard.detect_leak(baselines.leaky_oracle(), mkt["prices"],
                                     np.random.default_rng(4))["leak"] is True

    # the court refuses to score a leaky strategy
    try:
        walk_forward.walk_forward(mkt["prices"], baselines.leaky_oracle(),
                                  np.random.default_rng(4))
        raise AssertionError("court must refuse a leaky strategy")
    except AssertionError as e:
        assert "LEAK" in str(e), e
    print("test_backtest: OK")
    return True


if __name__ == "__main__":
    run()
