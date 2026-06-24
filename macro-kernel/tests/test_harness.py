"""Kernel harness: the oracle rejects a wrong kernel; a correct (fused/unfused) kernel wins the race."""
import numpy as np
from foundation.kernel import harness


def run():
    rng = np.random.default_rng(0)
    D = 4096
    a = rng.uniform(-np.pi, np.pi, D)
    b = rng.uniform(-np.pi, np.pi, D)
    q = rng.uniform(-np.pi, np.pi, D)

    candidates = {
        "fused": harness.fused,
        "unfused": harness.unfused,
        "wrong": lambda a, b, q: float(np.mean(np.cos((a - b) - q))),   # a deliberately wrong kernel
    }
    res = harness.run_loop(harness.reference_bind_score, candidates, (a, b, q))
    by = {c["name"]: c for c in res["candidates"]}

    # the correctness ORACLE rejects the wrong kernel (incorrect, infinite time)
    assert by["wrong"]["correct"] is False and by["wrong"]["ms"] == float("inf")
    # both correct kernels pass; the winner is a correct one
    assert by["fused"]["correct"] and by["unfused"]["correct"]
    assert res["best"] in ("fused", "unfused")

    print("test_harness: OK (oracle rejects wrong kernel; best=%s @ %.4f ms)"
          % (res["best"], by[res["best"]]["ms"]))
    return True


if __name__ == "__main__":
    run()
