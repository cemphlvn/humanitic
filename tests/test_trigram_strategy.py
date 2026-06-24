"""trigram_strategy: decode respects the conservative cap; momentum/mean-reversion oppose; try ranks."""
import numpy as np
from foundation.operator import trigram_strategy as ts
from foundation.backtest import synthetic


def run():
    mkt = synthetic.generate(n_days=800, seed=3)
    prices = mkt["prices"]

    # conservative cap is enforced
    strat = ts.decode(["regime:trending", "edge:momentum", "risk:capped"])
    wmax = max(abs(strat.target_weight(prices, t)) for t in range(30, 400))
    assert wmax <= ts.MAX_GROSS + 1e-9, wmax

    # momentum follows, mean-reversion fades — opposite signs (when the signal is non-flat)
    mom = ts.decode(["x", "edge:momentum", "risk:half"])
    rev = ts.decode(["x", "edge:mean_reversion", "risk:half"])
    a = mom.target_weight(prices, 120)
    b = rev.target_weight(prices, 120)
    assert a == 0 or np.sign(a) == -np.sign(b), (a, b)

    # try a roster of trigram strategies; ranked, each with a verdict
    rows = ts.try_strategies(prices, ts.FIXTURE_TRIGRAMS, seed=1)
    assert len(rows) == len(ts.FIXTURE_TRIGRAMS)
    assert all(r["verdict"] in ("LIVES", "DIES") for r in rows)
    assert rows == sorted(rows, key=lambda r: (r["oos_excess_bits"], r["oos_sharpe"]), reverse=True)
    print("test_trigram_strategy: OK (%d strategies, top=%s %s)"
          % (len(rows), "·".join(rows[0]["trigram"]), rows[0]["verdict"]))
    return True


if __name__ == "__main__":
    run()
