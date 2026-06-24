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
    jp = sub.add_parser("join", help="pull a real stream + run the causal as-of join")
    jp.add_argument("--target", choices=["hivemapper", "geodnet"], default="geodnet")
    jp.add_argument("--live", action="store_true", help="attempt a live network pull (needs endpoint/creds)")
    mp = sub.add_parser("mine", help="pull+join+mine into .local; put a capital-growth metric on trial")
    mp.add_argument("--target", choices=["hivemapper", "geodnet"], default="geodnet")
    mp.add_argument("--live", action="store_true", help="attempt a live network pull (needs endpoint/creds)")
    mp.add_argument("--no-local", action="store_true", help="do not write .local")
    sub.add_parser("edge", help="unsupervised regime discovery + dynamic trading, judged by court + Granger")
    cp = sub.add_parser("creds", help="show which live credentials are configured (presence only, never values)")
    cp.add_argument("--target", choices=["geodnet", "hivemapper", "market"], default=None)
    sub.add_parser("contain", help="show containment status (interface, egress allowlist, confinement)")
    pp = sub.add_parser("paper", help="paper trading (simulated money) — advance the persistent .local account")
    pp.add_argument("--no-local", action="store_true", help="do not write .local")
    fp = sub.add_parser("fit", help="time-interval-infra-fit: sweep intervals, judged by the Deflated Sharpe")
    fp.add_argument("--bars", type=int, default=8000, help="history length (bars)")
    args = p.parse_args(argv)

    cfg = MachineConfig.load()
    if args.cmd == "once":
        print(json.dumps(runner.run_once(cfg)))
        return 0
    if args.cmd == "loop":
        for r in runner.run_loop(cfg, cycles=args.cycles, sleep=args.sleep):
            print(json.dumps(r))
        return 0
    if args.cmd == "join":
        from foundation.runtime import realjoin
        fn = realjoin.live_join if args.live else realjoin.replay_join
        print(json.dumps(fn(args.target)))
        return 0
    if args.cmd == "mine":
        from foundation.runtime import mine as mine_mod
        print(json.dumps(mine_mod.mine(args.target, live=args.live, write_local=not args.no_local), indent=2))
        return 0
    if args.cmd == "edge":
        from foundation.regime import unsupervised
        print(json.dumps(unsupervised.edge_report(), indent=2))
        return 0
    if args.cmd == "creds":
        from foundation.security import credentials
        print(json.dumps(credentials.describe(args.target), indent=2))
        return 0
    if args.cmd == "contain":
        from foundation.security import containment
        print(json.dumps(containment.status(), indent=2))
        return 0
    if args.cmd == "paper":
        from foundation.runtime import paper
        print(json.dumps(paper.run_paper(write_local=not args.no_local), indent=2))
        return 0
    if args.cmd == "fit":
        from foundation.runtime import paper
        print(json.dumps(paper.run_fit(n=args.bars), indent=2))
        return 0
    g = MemoryGuard(cfg.get("resources", "max_ram_mb", default=2048))
    print(json.dumps({"engine": cfg.engine, "broker": cfg.broker, "risk": cfg.risk,
                      "rss_mb": round(g.rss_mb(), 1), "budget_mb": g.max_ram_mb,
                      "under_budget": g.under_budget()}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
