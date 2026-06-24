#!/usr/bin/env python3
"""
run_health — the clean health runner. The observability/CLI layer over
`foundation.health.monitor` (which stays the pure compute library).

Debugging-cleanliness practices applied (researched, agentic-engineering):
  - typed, uniform per-check results {name,status,summary,data,remediation}      (separation of concerns)
  - each check ISOLATED: one failure -> status ERROR + message, run continues     (fail-soft)
  - stable machine schema on stdout via --json (schema_version, root status)      (agent-parseable)
  - human table by default; logging/diagnostics to STDERR, never stdout           (clean streams)
  - explicit exit codes: 0 pass/warn · 1 fail/error · 2 runner error              (shell/agent branching)
  - environment + UTC timestamp captured every run                                (debuggable snapshots)
  - deterministic & diff-able: checks sorted by name, seeded RNG, no color         (clean diffs)
  - actionable `remediation` on every non-PASS check                              (agent's next move)
  - side effect (HEALTH.md refresh) is explicit and logged; --no-write disables    (no surprise writes)

    python3 run_health.py            # human table  (also refreshes HEALTH.md)
    python3 run_health.py --json     # machine-readable, stdout only
    python3 run_health.py --quiet    # exit code only
    python3 run_health.py -v         # + DEBUG logs & tracebacks to stderr
"""
import argparse
import datetime
import gc
import json
import logging
import platform
import sys
import traceback
import tracemalloc

import numpy as np

from foundation.health import monitor

SCHEMA_VERSION = "1.0"
log = logging.getLogger("run_health")

_RANK = {"PASS": 0, "WARN": 1, "FAIL": 2, "ERROR": 3}

_REMEDIATION = {
    "vsa_throughput": "cleanup is the hot primitive — profile foundation/kernel/vsa.cleanup; a Metal/Triton "
                      "kernel is the next lever (see HEALTH.md Improve).",
    "capacity_envelope": "bundle recall breaks early — lower factors-per-regime (FACTOR_CAP) or raise D; "
                         "'store factors not items'.",
    "backtest_speed": "walk_forward slow — vectorize the decision loop or cut n_days while iterating.",
    "memory": "peak memory high — shrink the probe codebook/distractors or D.",
    "suite": "no test_*.py found — add tests under tests/.",
}


def _now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")


def _env():
    return {"python": platform.python_version(), "numpy": np.__version__,
            "platform": platform.platform()}


def _summary(name, d):
    if name == "vsa_throughput":
        return "bind %.4f / bundle %.4f / cleanup %.4f ms-per-op" % (
            d["bind_ms"], d["bundle_ms"], d["cleanup_ms"])
    if name == "capacity_envelope":
        return ("bundle wall: %s" % ("none in probed range"
                if d["wall_k"] is None else "k=%d" % d["wall_k"]))
    if name == "backtest_speed":
        return "%.1f ms, OOS %.2f bits / cap %.0f" % (
            d["ms"], d["oos_held_bits"], d["capacity_bits"])
    if name == "memory":
        return "peak %.1f MB" % d["peak_mb"]
    if name == "suite":
        return "%d test_*.py files" % d["test_files"]
    return ""


def _check(name, fn):
    """Run one check in isolation. A raise becomes status ERROR — never crashes the run."""
    try:
        data = fn()
        status = data.get("status", "PASS")
        return {"name": name, "status": status, "summary": _summary(name, data),
                "data": data, "remediation": None if status == "PASS" else _REMEDIATION.get(name)}
    except Exception as e:                                     # fail-soft, not bare except
        log.error("check %r raised: %s: %s", name, type(e).__name__, e)
        log.debug("traceback:\n%s", traceback.format_exc())
        return {"name": name, "status": "ERROR",
                "summary": "%s: %s" % (type(e).__name__, e),
                "data": {"error": str(e)},
                "remediation": "check raised; re-run with --verbose for the traceback"}


def build_report(seed=0, write=True, quick=False):
    """Run every check (isolated, under one tracemalloc window) and return the structured report."""
    iters = 200 if quick else 2000
    ks = (2, 8, 32) if quick else (2, 4, 8, 16, 32, 64, 128)
    trials = 3 if quick else 12

    gc.collect()
    tracemalloc.start()
    rng = np.random.default_rng(seed)                          # deterministic — seed, never the clock
    checks = [
        _check("vsa_throughput", lambda: monitor.check_vsa_throughput(rng, iters=iters)),
        _check("capacity_envelope", lambda: monitor.check_capacity_envelope(rng, ks=ks, trials=trials)),
        _check("backtest_speed", monitor.check_backtest_speed),
        _check("suite", monitor.check_suite_hook),
    ]
    peak_mb = tracemalloc.get_traced_memory()[1] / (1024 * 1024)
    tracemalloc.stop()
    mem_status = monitor._verdict(peak_mb, monitor.TH_MEM_PEAK_MB_WARN, monitor.TH_MEM_PEAK_MB_FAIL)
    checks.append({"name": "memory", "status": mem_status, "summary": "peak %.1f MB" % peak_mb,
                   "data": {"peak_mb": peak_mb, "status": mem_status},
                   "remediation": None if mem_status == "PASS" else _REMEDIATION["memory"]})

    checks.sort(key=lambda c: c["name"])                       # deterministic, diff-able ordering
    status = max((c["status"] for c in checks), key=lambda s: _RANK.get(s, 3))
    report = {"schema_version": SCHEMA_VERSION, "status": status, "timestamp_utc": _now_iso(),
              "env": _env(), "D": monitor.D, "checks": checks}

    if write:
        try:
            shape = {"status": status, "D": monitor.D,
                     "checks": {c["name"]: c["data"] for c in checks}}
            if monitor._write_snapshot(shape):
                log.info("refreshed HEALTH.md snapshot")
            else:
                log.warning("HEALTH.md snapshot not refreshed (markers missing)")
        except Exception as e:                                 # a write failure must not fail the run
            log.warning("HEALTH.md not refreshed: %s", e)
    return report


def _format_human(r):
    L = ["ark health  ·  %s  ·  py%s np%s  ·  %s"
         % (r["timestamp_utc"], r["env"]["python"], r["env"]["numpy"], r["env"]["platform"]),
         "-" * 78]
    for c in r["checks"]:
        L.append("[%-4s] %-18s %s" % (c["status"], c["name"], c["summary"]))
        if c["remediation"]:
            L.append("        -> %s" % c["remediation"])
    L.append("-" * 78)
    L.append("OVERALL: %s   (schema %s)" % (r["status"], r["schema_version"]))
    return "\n".join(L)


def main(argv=None):
    p = argparse.ArgumentParser(description="ark computational health runner")
    p.add_argument("--json", action="store_true", help="machine-readable JSON to stdout")
    p.add_argument("-v", "--verbose", action="store_true", help="DEBUG logs + tracebacks to stderr")
    p.add_argument("-q", "--quiet", action="store_true", help="exit code only, no stdout report")
    p.add_argument("--no-write", action="store_true", help="do not refresh HEALTH.md")
    p.add_argument("--seed", type=int, default=0, help="RNG seed (default 0)")
    args = p.parse_args(argv)

    level = logging.DEBUG if args.verbose else (logging.ERROR if args.quiet else logging.WARNING)
    logging.basicConfig(stream=sys.stderr, level=level, format="%(levelname)s %(name)s: %(message)s")

    report = build_report(seed=args.seed, write=not args.no_write)

    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))   # stable, diff-able
    elif not args.quiet:
        print(_format_human(report))

    return 0 if report["status"] in ("PASS", "WARN") else 1    # FAIL/ERROR -> 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:                                     # runner-level error -> 2
        logging.getLogger("run_health").critical("runner error: %s: %s", type(e).__name__, e)
        sys.exit(2)
