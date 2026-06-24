"""
harness — the agentic KERNEL HARNESS with FUSION.

The kernel-engineering loop the lineage points at (KernelBench / KernelEvolve): an agent PROPOSES
candidate kernels; this harness is the deterministic fitness core — CHECK each against a correctness
oracle, BENCHMARK the correct ones, KEEP THE BEST. The win it chases is FUSION: a bandwidth-bound VSA
composite (bind two phase vectors, then reduce) materializes an intermediate array when unfused;
fused into one expression it makes one pass over memory. "Fusion saves memory movement."

numpy floor (always runs; the loop + oracle). On MLX, `mx.compile` is the real fusion primitive
(Metal) — see the node and the venv bench.
"""
import time
import numpy as np


def bench(fn, n=2000, warmup=10):
    for _ in range(warmup):
        fn()
    t0 = time.perf_counter()
    for _ in range(n):
        fn()
    return (time.perf_counter() - t0) / n


def run_loop(reference, candidates, inputs, atol=1e-4, n=2000):
    """Each candidate must MATCH the reference oracle, then the correct ones race; keep the fastest.
    `candidates`: name -> fn. `inputs`: tuple passed to every fn (oracle + candidates)."""
    ref = np.asarray(reference(*inputs))
    out = []
    for name, fn in candidates.items():
        correct = bool(np.allclose(np.asarray(fn(*inputs)), ref, atol=atol))
        ms = bench(lambda: fn(*inputs), n) * 1e3 if correct else float("inf")
        out.append({"name": name, "correct": correct, "ms": ms})
    out.sort(key=lambda r: (not r["correct"], r["ms"]))           # correct first, then fastest
    return {"best": out[0]["name"], "candidates": out}


# the fusion case: "bind two phase vectors, score vs a query" — bandwidth-bound (bind then reduce)
def reference_bind_score(a, b, q):
    return np.mean(np.cos((a + b) - q))


def unfused(a, b, q):
    bound = a + b                                                 # named intermediate -> materialized
    diff = bound - q                                             # another pass
    return np.mean(np.cos(diff))


def fused(a, b, q):
    return np.mean(np.cos((a + b) - q))                          # one expression -> fusible
