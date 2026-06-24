"""Win-rate metrics, the honest way: a high hit rate with bad payoff is NOT an edge; the binomial test
vs breakeven says so. Low hit rate with great payoff IS an edge."""
import numpy as np

from foundation.eval import winrate as W


def run():
    rng = np.random.default_rng(0)

    # HIGH hit rate (80%) but BAD payoff (small wins, rare big losses) -> negative expectancy, no edge
    bad = np.where(rng.random(2000) < 0.8, 0.5, -3.0)
    bm = W.hit_rate_significance(bad)
    assert abs(bm["hit_rate"] - 0.8) < 0.04
    assert bm["expectancy"] < 0
    assert bm["hit_rate"] < bm["breakeven_win_rate"]          # breakeven ~0.857 > 0.80
    assert not bm["beats_breakeven"]

    # LOW hit rate (35%) but GREAT payoff (winners 3x) -> positive expectancy, real edge
    good = np.where(rng.random(2000) < 0.35, 3.0, -1.0)
    gm = W.hit_rate_significance(good)
    assert gm["expectancy"] > 0
    assert gm["hit_rate"] > gm["breakeven_win_rate"]          # breakeven 0.25 < 0.35
    assert gm["beats_breakeven"] and gm["p_value_vs_breakeven"] < 0.05

    # Wilson CI brackets the point estimate
    lo, hi = gm["wilson_ci"]
    assert 0.0 <= lo < gm["hit_rate"] < hi <= 1.0

    print("test_winrate: OK (hit 80%%/bad payoff -> no edge; hit 35%%/great payoff -> edge; breakeven+Wilson+binomial)")
    return True


if __name__ == "__main__":
    run()
