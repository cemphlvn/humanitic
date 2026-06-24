"""
COMPUTATIONAL HEALTH MONITOR — limit-testing THIS Mac, checked constantly.

Refutation ethos: this file does not flatter the hardware. It times the VSA primitives,
walks the empirical `bundle` capacity wall (LABNOTES: "store factors not items"), times the
evidence court, and watches memory — then reports PASS / WARN / FAIL against explicit, stable
thresholds. A WARN is a wall getting close; a FAIL is a wall hit. We report the wall; we never
claim past it.

Offline, this Mac, numpy + stdlib only. Deterministic: every randomness comes from a seed
(np.random.default_rng) — never the wall clock. Timing uses time.perf_counter.

    Run:  PYTHONPATH=. python3 -m foundation.health.monitor
"""
import os
import gc
import glob
import time
import tracemalloc
import numpy as np

from foundation.kernel import vsa
from foundation.spine import conservation as C
from foundation.backtest import synthetic
from foundation.backtest.walk_forward import walk_forward
from foundation.operator.baselines import momentum

D = 4096                          # the working hypervector dimension (complex64)
HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
HEALTH_MD = os.path.join(ROOT, "HEALTH.md")

# ── explicit, STABLE thresholds (the walls, named) ────────────────────────────
# Generous enough to pass on a healthy Mac, tight enough that a regression trips them.
TH_BIND_MS_WARN = 0.5             # bind at D=4096 should be well under this
TH_BIND_MS_FAIL = 5.0
TH_BUNDLE_MS_WARN = 1.0           # bundle of ~50 at D=4096
TH_BUNDLE_MS_FAIL = 10.0
TH_CLEANUP_MS_WARN = 3.0          # cleanup vs a 1000-word codebook (one matvec + top-k)
TH_CLEANUP_MS_FAIL = 25.0
TH_RECALL_FLOOR = 0.9            # bundle recall must hold above this to be "clean"
TH_WALL_K_WARN = 16             # if the wall lands at/below this k, the envelope is tight (FACTOR_CAP)
TH_WALL_K_FAIL = 4             # if recall breaks at/below this k, the bundle is barely usable
TH_BACKTEST_MS_WARN = 1500.0     # a 1500-day walk_forward
TH_BACKTEST_MS_FAIL = 8000.0
TH_MEM_PEAK_MB_WARN = 256.0      # tracemalloc peak across the whole run
TH_MEM_PEAK_MB_FAIL = 1024.0

_RANK = {"PASS": 0, "WARN": 1, "FAIL": 2}


def _verdict(value, warn, fail, higher_is_worse=True):
    """PASS/WARN/FAIL of a measured value against two thresholds."""
    if higher_is_worse:
        if value >= fail:
            return "FAIL"
        if value >= warn:
            return "WARN"
        return "PASS"
    else:
        if value <= fail:
            return "FAIL"
        if value <= warn:
            return "WARN"
        return "PASS"


def _worst(statuses):
    return max(statuses, key=lambda s: _RANK[s]) if statuses else "PASS"


# ── check 1: VSA throughput ───────────────────────────────────────────────────
def check_vsa_throughput(rng, iters=2000):
    """Time the three hot primitives: bind, bundle(of ~50), cleanup(codebook 1000) at D=4096."""
    a = vsa.rand_hv(D, rng)
    b = vsa.rand_hv(D, rng)
    bundle_set = [vsa.rand_hv(D, rng) for _ in range(50)]
    codebook = np.stack([vsa.rand_hv(D, rng) for _ in range(1000)])
    noisy = codebook[123] * np.exp(1j * rng.normal(0, 0.4, D)).astype(np.complex64)

    # warm up (let numpy/BLAS settle so the first matvec doesn't skew the number)
    for _ in range(50):
        vsa.bind(a, b); vsa.bundle(bundle_set); vsa.cleanup(noisy, codebook, 1)

    def _time(fn, n):
        t0 = time.perf_counter()
        for _ in range(n):
            fn()
        return (time.perf_counter() - t0) / n

    bind_s = _time(lambda: vsa.bind(a, b), iters)
    bundle_s = _time(lambda: vsa.bundle(bundle_set), iters)
    cleanup_s = _time(lambda: vsa.cleanup(noisy, codebook, 1), iters)

    bind_ms, bundle_ms, cleanup_ms = bind_s * 1e3, bundle_s * 1e3, cleanup_s * 1e3
    statuses = [
        _verdict(bind_ms, TH_BIND_MS_WARN, TH_BIND_MS_FAIL),
        _verdict(bundle_ms, TH_BUNDLE_MS_WARN, TH_BUNDLE_MS_FAIL),
        _verdict(cleanup_ms, TH_CLEANUP_MS_WARN, TH_CLEANUP_MS_FAIL),
    ]
    return {
        "D": D, "iters": iters, "codebook": 1000, "bundle_n": 50,
        "bind_ms": bind_ms, "bind_ops_per_s": 1.0 / bind_s,
        "bundle_ms": bundle_ms, "bundle_ops_per_s": 1.0 / bundle_s,
        "cleanup_ms": cleanup_ms, "cleanup_ops_per_s": 1.0 / cleanup_s,
        "status": _worst(statuses),
    }


# ── check 2: capacity-envelope probe — the empirical bundle wall on this Mac ───
def check_capacity_envelope(rng, ks=(2, 4, 8, 16, 32, 64, 128), trials=12):
    """
    The LABNOTES wall, MEASURED here. Encode a regime exactly as the index does — bundle of k
    random bound (role<->filler) pairs — then QUERY THE BUNDLE ITSELF with `cleanup` against a
    codebook of {the k planted pairs} + {a field of distractor pairs}. recall = fraction of the k
    planted pairs that land in cleanup's top-k over the distractors. This is the true superposition
    test: each planted pair sits in the bundle at signal ~1/sqrt(k), so as k grows the crosstalk
    from the other components drowns the signal and recall falls. The k where recall first drops
    below 0.9 is the empirical bundle wall on this Mac. "Store factors not items."
    """
    DISTRACTORS = 256
    curve = []          # (k, recall)
    for k in ks:
        hits = total = 0
        for _ in range(trials):
            roles = [vsa.rand_hv(D, rng) for _ in range(k)]
            fillers = [vsa.rand_hv(D, rng) for _ in range(k)]
            pairs = [vsa.bind(roles[i], fillers[i]) for i in range(k)]
            mem = vsa.bundle(pairs)                          # the superposed regime
            # codebook: the k true bound pairs (rows 0..k-1) + a field of distractor pairs
            distractors = [vsa.bind(vsa.rand_hv(D, rng), vsa.rand_hv(D, rng))
                           for _ in range(DISTRACTORS)]
            codebook = np.stack(pairs + distractors)
            # query the bundle directly: cleanup's top-k SHOULD be exactly the k planted rows.
            idx, _ = vsa.cleanup(mem, codebook, k)
            planted = set(range(k))                          # rows 0..k-1 are the planted pairs
            hits += len(planted & set(int(i) for i in idx)) # how many planted survived crosstalk
            total += k
        recall = hits / total
        curve.append((k, recall))

    # the wall: first k whose recall dips below the floor
    wall_k = None
    for k, recall in curve:
        if recall < TH_RECALL_FLOOR:
            wall_k = k
            break

    if wall_k is None:
        status = "PASS"          # never broke across the probed range — healthy envelope
    else:
        status = _verdict(wall_k, TH_WALL_K_WARN, TH_WALL_K_FAIL, higher_is_worse=False)

    return {
        "ks": list(ks), "trials": trials, "distractors": DISTRACTORS,
        "recall_curve": [{"k": k, "recall": r} for k, r in curve],
        "wall_k": wall_k, "factor_cap_hint": 16,
        "status": status,
    }


# ── check 3: backtest speed ───────────────────────────────────────────────────
def check_backtest_speed(seed=7, n_days=1500):
    """Time one walk_forward over a 1500-day synthetic market; report ms and decisions/sec."""
    market = synthetic.generate(n_days=n_days, seed=seed)
    prices = market["prices"]
    strat = momentum(20)
    rng = np.random.default_rng(seed)

    t0 = time.perf_counter()
    res = walk_forward(prices, strat, rng, D=D)
    elapsed_s = time.perf_counter() - t0

    decisions = int(res["all"]["n"])
    ms = elapsed_s * 1e3
    return {
        "n_days": n_days, "decisions": decisions,
        "ms": ms, "decisions_per_s": decisions / elapsed_s if elapsed_s > 0 else 0.0,
        "oos_held_bits": float(res["edge"]["oos"]["held_bits"]),
        "capacity_bits": float(res["edge"]["capacity_bits"]),
        "capacity_exceeded": bool(res["edge"]["capacity_exceeded"]),
        "oos_bit_retention": float(res["edge"]["oos_bit_retention"]),
        "status": _verdict(ms, TH_BACKTEST_MS_WARN, TH_BACKTEST_MS_FAIL),
    }


# ── check 5: suite hook (counts only — do NOT run, keep the monitor fast) ──────
def check_suite_hook():
    test_files = sorted(glob.glob(os.path.join(ROOT, "tests", "test_*.py")))
    return {
        "test_files": len(test_files),
        "names": [os.path.basename(p) for p in test_files],
        "runner": "tests/run_all.py",
        "note": "suites are NOT run here (kept fast); run: PYTHONPATH=. python3 tests/run_all.py",
        "status": "PASS" if test_files else "WARN",
    }


# ── orchestrator ──────────────────────────────────────────────────────────────
def health():
    """Run every check under one tracemalloc window. Returns metrics + a top-level status."""
    gc.collect()
    tracemalloc.start()
    rng = np.random.default_rng(0)            # deterministic — seed, never the clock

    vsa_m = check_vsa_throughput(rng)
    cap_m = check_capacity_envelope(rng)
    bt_m = check_backtest_speed()
    suite_m = check_suite_hook()

    _cur, peak_bytes = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    peak_mb = peak_bytes / (1024 * 1024)
    mem_m = {
        "peak_mb": peak_mb,
        "status": _verdict(peak_mb, TH_MEM_PEAK_MB_WARN, TH_MEM_PEAK_MB_FAIL),
    }

    checks = {
        "vsa_throughput": vsa_m,
        "capacity_envelope": cap_m,
        "backtest_speed": bt_m,
        "memory": mem_m,
        "suite": suite_m,
    }
    status = _worst([c["status"] for c in checks.values()])
    return {"status": status, "D": D, "checks": checks}


# ── reporting ─────────────────────────────────────────────────────────────────
def _fmt_report(h):
    L = []
    L.append("=" * 70)
    L.append("ark COMPUTATIONAL HEALTH — limit-testing this Mac (D=%d)" % h["D"])
    L.append("=" * 70)
    c = h["checks"]

    v = c["vsa_throughput"]
    L.append("[%s] VSA throughput  (D=%d, codebook=%d, bundle_n=%d, iters=%d)"
             % (v["status"], v["D"], v["codebook"], v["bundle_n"], v["iters"]))
    L.append("       bind    : %8.4f ms/op   %12.0f ops/s   (warn>=%.2f fail>=%.1f ms)"
             % (v["bind_ms"], v["bind_ops_per_s"], TH_BIND_MS_WARN, TH_BIND_MS_FAIL))
    L.append("       bundle  : %8.4f ms/op   %12.0f ops/s   (warn>=%.2f fail>=%.1f ms)"
             % (v["bundle_ms"], v["bundle_ops_per_s"], TH_BUNDLE_MS_WARN, TH_BUNDLE_MS_FAIL))
    L.append("       cleanup : %8.4f ms/op   %12.0f ops/s   (warn>=%.2f fail>=%.1f ms)"
             % (v["cleanup_ms"], v["cleanup_ops_per_s"], TH_CLEANUP_MS_WARN, TH_CLEANUP_MS_FAIL))

    cap = c["capacity_envelope"]
    L.append("[%s] Capacity envelope  (the bundle wall, measured; recall floor=%.2f)"
             % (cap["status"], TH_RECALL_FLOOR))
    L.append("       recall(k): " + "  ".join("k=%d:%.2f" % (e["k"], e["recall"])
                                              for e in cap["recall_curve"]))
    if cap["wall_k"] is None:
        L.append("       WALL    : none in probed range %s — envelope holds (store factors not items)"
                 % cap["ks"])
    else:
        L.append("       WALL    : recall drops below %.2f at k=%d  <-- empirical bundle wall on this Mac"
                 % (TH_RECALL_FLOOR, cap["wall_k"]))

    bt = c["backtest_speed"]
    L.append("[%s] Backtest speed  (%d-day synthetic walk_forward)"
             % (bt["status"], bt["n_days"]))
    L.append("       %.1f ms   %.0f decisions/s   (%d decisions)   (warn>=%.0f fail>=%.0f ms)"
             % (bt["ms"], bt["decisions_per_s"], bt["decisions"],
                TH_BACKTEST_MS_WARN, TH_BACKTEST_MS_FAIL))
    L.append("       OOS held=%.2f bits  cap C(D)=%.0f bits  exceeded=%s  retention=%.3f"
             % (bt["oos_held_bits"], bt["capacity_bits"],
                bt["capacity_exceeded"], bt["oos_bit_retention"]))

    mem = c["memory"]
    L.append("[%s] Memory  peak=%.1f MB   (warn>=%.0f fail>=%.0f MB)"
             % (mem["status"], mem["peak_mb"], TH_MEM_PEAK_MB_WARN, TH_MEM_PEAK_MB_FAIL))

    s = c["suite"]
    L.append("[%s] Suite hook  %d test_*.py files via %s (not run here)"
             % (s["status"], s["test_files"], s["runner"]))

    L.append("-" * 70)
    L.append("OVERALL: %s" % h["status"])
    L.append("=" * 70)
    return "\n".join(L)


def _snapshot_block(h):
    """The machine-refreshed numbers that live between the HEALTH.md markers."""
    c = h["checks"]
    v, cap, bt, mem, s = (c["vsa_throughput"], c["capacity_envelope"],
                          c["backtest_speed"], c["memory"], c["suite"])
    wall = ("none in probed range" if cap["wall_k"] is None
            else "k=%d (recall < %.2f)" % (cap["wall_k"], TH_RECALL_FLOOR))
    curve = " &nbsp; ".join("k=%d:%.2f" % (e["k"], e["recall"]) for e in cap["recall_curve"])
    L = []
    L.append("| check | metric | value | status |")
    L.append("|---|---|---|---|")
    L.append("| VSA throughput | bind | %.4f ms/op (%.0f ops/s) | %s |"
             % (v["bind_ms"], v["bind_ops_per_s"], v["status"]))
    L.append("| VSA throughput | bundle (n=50) | %.4f ms/op (%.0f ops/s) | %s |"
             % (v["bundle_ms"], v["bundle_ops_per_s"], v["status"]))
    L.append("| VSA throughput | cleanup (codebook 1000) | %.4f ms/op (%.0f ops/s) | %s |"
             % (v["cleanup_ms"], v["cleanup_ops_per_s"], v["status"]))
    L.append("| Capacity envelope | recall curve | %s | %s |" % (curve, cap["status"]))
    L.append("| Capacity envelope | **bundle wall** | **%s** | %s |" % (wall, cap["status"]))
    L.append("| Backtest speed | walk_forward (1500d) | %.1f ms (%.0f decisions/s) | %s |"
             % (bt["ms"], bt["decisions_per_s"], bt["status"]))
    L.append("| Backtest speed | OOS edge | %.2f bits / cap %.0f (exceeded=%s) | %s |"
             % (bt["oos_held_bits"], bt["capacity_bits"], bt["capacity_exceeded"], bt["status"]))
    L.append("| Memory | tracemalloc peak | %.1f MB | %s |" % (mem["peak_mb"], mem["status"]))
    L.append("| Suite | test_*.py files | %d (via %s) | %s |"
             % (s["test_files"], s["runner"], s["status"]))
    L.append("")
    L.append("**OVERALL: %s** &nbsp;·&nbsp; D=%d &nbsp;·&nbsp; numpy-only, this Mac, deterministic (seeded)."
             % (h["status"], h["D"]))
    return "\n".join(L)


SNAP_OPEN = "<!--SNAPSHOT-->"
SNAP_CLOSE = "<!--/SNAPSHOT-->"


def _write_snapshot(h):
    """Refresh the snapshot block between the markers in HEALTH.md (leaves the rest untouched)."""
    if not os.path.exists(HEALTH_MD):
        return False
    with open(HEALTH_MD, "r") as f:
        text = f.read()
    if SNAP_OPEN not in text or SNAP_CLOSE not in text:
        return False
    pre, _, rest = text.partition(SNAP_OPEN)
    _, _, post = rest.partition(SNAP_CLOSE)
    block = "%s\n%s\n%s" % (SNAP_OPEN, _snapshot_block(h), SNAP_CLOSE)
    with open(HEALTH_MD, "w") as f:
        f.write(pre + block + post)
    return True


def main():
    h = health()
    print(_fmt_report(h))
    wrote = _write_snapshot(h)
    print("HEALTH.md snapshot: %s" % ("refreshed" if wrote else "NOT written (markers missing)"))
    # exit 0 iff all PASS/WARN (a FAIL = a wall hit)
    return 0 if h["status"] in ("PASS", "WARN") else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
