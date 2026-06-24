"""
f01 — the ethical backtest, end to end:  thesis -> StrategyObject -> the court -> verdict (in bits).

Synthetic regime market today; the SAME contract re-runs on real data when the point-in-time adapter
lands (Arc 1). Offline, numpy only. Honesty is the success metric, not return.

    PYTHONPATH=. python3 experiments/f01_ethical_backtest/run.py
"""
import numpy as np
from foundation.backtest import synthetic, walk_forward
from foundation.operator import baselines


def main():
    mkt = synthetic.generate(n_days=1500, seed=7)
    strat = baselines.momentum(k=20)                  # thesis: momentum persists in trending regimes
    res = walk_forward.walk_forward(mkt["prices"], strat, np.random.default_rng(11), D=4096)
    oos, e = res["oos"], res["edge"]

    print("f01 — ethical backtest (synthetic regime market)")
    print(f"  thesis : {strat.thesis}")
    print(f"  OOS    : ret {oos['total_return']:+.3f}  sharpe {oos['sharpe']:+.2f}  "
          f"maxdd {oos['max_dd']:+.3f}  n={oos['n']}")
    print(f"  edge   : oos {e['oos']['held_bits']:.1f} bits  (excess {e['oos']['excess_bits']:+.1f})  "
          f"/ capacity {e['capacity_bits']:.0f} bits")
    print(f"  honesty: IS->OOS bit retention {e['oos_bit_retention']:.2f}   "
          f"capacity_exceeded {e['capacity_exceeded']}")

    lives = (e["oos"]["excess_bits"] > 0.0) and (oos["sharpe"] > 0.0)
    print(f"  VERDICT: {'LIVES' if lives else 'DIES'}")
    if not lives:
        print("  autopsy -> failure database: no positive OOS excess edge (in bits); "
              "honesty over return. The corpse teaches more than a lucky window would.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
