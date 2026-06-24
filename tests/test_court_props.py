"""
Adversarial tests for the evidence COURT — refutation ethos: we hand it cheats and demand it catch
EVERY one. The court's whole job is to refuse look-ahead leakage and never claim edge past capacity.

We build several DISTINCT leaky strategies (peeking at t+1, t+2, a whole future window) plus the
built-in leaky_oracle, and prove the leakage guard flags each AND walk_forward refuses to score them.
Clean momentum (several k) must pass. Costs are monotone. Splits are exact. Edge is honest.
"""
import numpy as np
from foundation.backtest import synthetic, walk_forward, leakage_guard
from foundation.operator import baselines
from foundation.spine import conservation as C


class _Leaky:
    """A minimal StrategyObject-like cheat: target_weight reads the FUTURE via `fn(prices, t)`."""
    def __init__(self, fn):
        self.fn = fn

    def target_weight(self, prices, t):
        return float(self.fn(prices, t))


def _peek_t1(prices, t):
    if t + 1 >= len(prices):
        return 0.0
    return np.sign(prices[t + 1] / prices[t] - 1.0)        # tomorrow


def _peek_t2(prices, t):
    if t + 2 >= len(prices):
        return 0.0
    return np.sign(prices[t + 2] / prices[t] - 1.0)        # day after tomorrow


def _peek_window(prices, t):
    if t + 5 >= len(prices):
        return 0.0
    fut = prices[t + 1:t + 6]                              # a whole future window
    return np.sign(float(np.mean(fut)) / prices[t] - 1.0)


def _peek_max(prices, t):
    if t + 3 >= len(prices):
        return 0.0
    return 1.0 if prices[t + 1:t + 4].max() > prices[t] else -1.0


def run():
    mkt = synthetic.generate(n_days=900, seed=7)
    prices = mkt["prices"]

    # == EVERY distinct cheat must be caught, by BOTH the guard and walk_forward ================
    cheats = {
        "oracle_t1": baselines.leaky_oracle(),
        "peek_t1":   _Leaky(_peek_t1),
        "peek_t2":   _Leaky(_peek_t2),
        "peek_win":  _Leaky(_peek_window),
        "peek_max":  _Leaky(_peek_max),
    }
    for name, strat in cheats.items():
        rep = leakage_guard.detect_leak(strat, prices, np.random.default_rng(11))
        assert rep["leak"] is True, f"guard FAILED to catch leaky strategy: {name}"
        # the court refuses to score it: walk_forward must raise AssertionError naming the LEAK
        try:
            walk_forward.walk_forward(prices, strat, np.random.default_rng(11))
            raise RuntimeError(f"court scored a leaky strategy: {name}")
        except AssertionError as e:
            assert "LEAK" in str(e), (name, str(e))

    # == clean momentum (several k) passes the guard AND runs ===================================
    for k in (5, 10, 20, 40):
        mom = baselines.momentum(k=k)
        assert leakage_guard.detect_leak(mom, prices, np.random.default_rng(3))["leak"] is False, k
        res = walk_forward.walk_forward(prices, mom, np.random.default_rng(3))
        assert res["oos"]["n"] > 0 and np.isfinite(res["oos"]["sharpe"]), k

    # == cost monotonicity: more bps -> total_return non-increasing =============================
    # Same strategy, same data, same rng seed -> identical weights; only the cost wedge changes.
    mom = baselines.momentum(k=20)
    cheap = walk_forward.walk_forward(prices, mom, np.random.default_rng(5), cost_bps=1.0)
    dear = walk_forward.walk_forward(prices, mom, np.random.default_rng(5), cost_bps=50.0)
    assert dear["all"]["total_return"] <= cheap["all"]["total_return"] + 1e-12, (
        "higher cost should not improve return",
        cheap["all"]["total_return"], dear["all"]["total_return"])
    # and a third point to confirm the trend is genuinely monotone, not a lucky pair
    mid = walk_forward.walk_forward(prices, mom, np.random.default_rng(5), cost_bps=10.0)
    assert dear["all"]["total_return"] <= mid["all"]["total_return"] + 1e-12
    assert mid["all"]["total_return"] <= cheap["all"]["total_return"] + 1e-12

    # == split integrity: in_sample n + oos n == all n =========================================
    for frac in (0.3, 0.5, 0.7):
        res = walk_forward.walk_forward(prices, mom, np.random.default_rng(2), oos_frac=frac)
        assert res["in_sample"]["n"] + res["oos"]["n"] == res["all"]["n"], (
            frac, res["in_sample"]["n"], res["oos"]["n"], res["all"]["n"])
        assert res["in_sample"]["n"] > 0 and res["oos"]["n"] > 0

    # == edge honesty ==========================================================================
    res = walk_forward.walk_forward(prices, mom, np.random.default_rng(9), D=4096)
    edge = res["edge"]
    # claimed OOS bits NEVER exceed the capacity ceiling (the court caps the claim)
    assert edge["claimed_oos_bits"] <= edge["capacity_bits"] + 1e-9
    # on the real D=4096 reservoir a clean momentum run does NOT exceed capacity
    assert edge["capacity_exceeded"] is False
    # the in/out edge dicts carry the full directional-edge shape
    for side in ("in_sample", "oos"):
        for key in ("n", "accuracy", "held_bits", "null_bits", "excess_bits", "bits_per_decision"):
            assert key in edge[side], (side, key)

    # demonstrate a genuine CAPACITY-EXCEED on a SMALL reservoir: a long accurate call array on
    # D=64 holds more bits than C(64) -> exactly the over-claim the court must refuse to honor.
    n = 1000
    rng = np.random.default_rng(123)
    actual = rng.choice([-1.0, 1.0], size=n)
    pred = actual.copy()                                   # perfect caller -> held ~ n bits
    de = C.directional_edge(pred, actual, D=64)
    assert de["held_bits"] > C.capacity(64), (de["held_bits"], C.capacity(64))
    # and the SAME signal routed through walk_forward's cap logic would be clipped:
    claimed = min(de["held_bits"], C.capacity(64))
    assert claimed <= C.capacity(64) + 1e-9 and (de["held_bits"] > C.capacity(64))

    print("test_court_props: OK")
    return True


if __name__ == "__main__":
    run()
