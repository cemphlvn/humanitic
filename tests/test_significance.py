"""The statistical court: a planted edge -> MEANINGFUL; pure noise -> NOT MEANINGFUL (it can say no)."""
import numpy as np

from foundation.eval import significance as sig
from foundation.runtime import mine as mine_mod


def run():
    rng = np.random.default_rng(0)
    n = 600
    z = rng.normal(0, 1, n)

    # a real (planted) edge is found
    real = sig.court(z, 0.0015 * z + rng.normal(0, 0.012, n), seed=1)
    assert real["verdict"] == "MEANINGFUL" and real["permutation_p"] < 0.05 and abs(real["newey_west_t"]) > 1.96

    # pure noise is correctly rejected — the court can say no
    null = sig.court(z, rng.normal(0, 0.012, n), seed=1)
    assert null["verdict"] == "NOT MEANINGFUL" and null["permutation_p"] > 0.05

    # the applied pipeline on the PERIODIC replay: the t-stat & bootstrap are FOOLED (significant), but
    # the permutation test catches the seasonal confound -> NOT MEANINGFUL. The court > a naive t-stat.
    rep = mine_mod.mine("geodnet", write_local=False)
    cg = rep["capital_growth"]
    assert rep["applied_search"].startswith("asof_searchsorted")
    assert abs(cg["newey_west_t"]) > 1.96                 # the naive test says "edge"
    assert cg["verdict"] == "NOT MEANINGFUL" and cg["permutation_p"] > 0.05   # the permutation says no
    assert rep["noise_control"]["verdict"] == "NOT MEANINGFUL"

    print("test_significance: OK (court finds iid edge p=%.3f, rejects noise; on the periodic replay the "
          "permutation catches the seasonal confound the t-stat=%.1f misses)"
          % (real["permutation_p"], cg["newey_west_t"]))
    return True


if __name__ == "__main__":
    run()
