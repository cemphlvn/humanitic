"""
foundation.selftest — one command proves the floor is real on this Mac.
    PYTHONPATH=. python3 -m foundation.selftest
"""
import numpy as np
from foundation.kernel import vsa
from foundation.backtest import synthetic, walk_forward, leakage_guard
from foundation.operator import baselines
from foundation.privacy import publish_guard


def main():
    print("== VSA floor ==")
    laws = vsa.selftest()
    for k, v in laws.items():
        print(f"  {k:28s} {v:+.3f}")

    print("== evidence court (synthetic · walk-forward · costs) ==")
    mkt = synthetic.generate(n_days=1500, seed=1)
    mom = baselines.momentum(k=20)
    res = walk_forward.walk_forward(mkt["prices"], mom, np.random.default_rng(2))
    for split in ("in_sample", "oos"):
        m = res[split]
        print(f"  {split:10s} n={m['n']:4d}  ret={m['total_return']:+.3f}  "
              f"sharpe={m['sharpe']:+.2f}  maxdd={m['max_dd']:+.3f}")

    print("== leakage guard (refutation) ==")
    clean = leakage_guard.detect_leak(mom, mkt["prices"], np.random.default_rng(3))
    leaky = leakage_guard.detect_leak(baselines.leaky_oracle(), mkt["prices"],
                                      np.random.default_rng(3))
    print(f"  clean momentum -> leak={clean['leak']}   (want False)")
    print(f"  leaky oracle   -> leak={leaky['leak']}   (want True)")

    print("== Article 0 publish guard ==")
    pub_ok = publish_guard.is_publishable("buy energy on the AI-capex thesis")
    loc_ok = publish_guard.is_publishable(".local/positions.json")
    print(f"  public text  publishable={pub_ok}   (want True)")
    print(f"  .local path  publishable={loc_ok}   (want False)")

    ok = (laws["bind->unbind recovers"] > 0.99 and not clean["leak"] and leaky["leak"]
          and pub_ok and not loc_ok)
    print("\nFLOOR:", "GREEN" if ok else "RED")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
