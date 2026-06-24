"""cli — trigger the runner: once | loop | status. (run.sh wraps this.)"""
import sys
import json
import argparse

from foundation.runtime import runner
from foundation.runtime.memory import MemoryGuard
from foundation.machine import MachineConfig


def main(argv=None):
    p = argparse.ArgumentParser(prog="ark-run", description="run the macro-kernel (local-safe, memory-safe)")
    sub = p.add_subparsers(dest="cmd")
    sub.add_parser("once", help="trigger a single run")
    lp = sub.add_parser("loop", help="run autonomously (bounded)")
    lp.add_argument("--cycles", type=int, default=3)
    lp.add_argument("--sleep", type=float, default=None)
    sub.add_parser("status", help="show config + memory budget")
    args = p.parse_args(argv)

    cfg = MachineConfig.load()
    if args.cmd == "once":
        print(json.dumps(runner.run_once(cfg)))
        return 0
    if args.cmd == "loop":
        for r in runner.run_loop(cfg, cycles=args.cycles, sleep=args.sleep):
            print(json.dumps(r))
        return 0
    g = MemoryGuard(cfg.get("resources", "max_ram_mb", default=2048))
    print(json.dumps({"engine": cfg.engine, "broker": cfg.broker, "risk": cfg.risk,
                      "rss_mb": round(g.rss_mb(), 1), "budget_mb": g.max_ram_mb,
                      "under_budget": g.under_budget()}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
