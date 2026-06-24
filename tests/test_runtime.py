"""Runtime: tunable memory guard that FAILS SAFE; run_once (paper); bounded loop; memory halt."""
from foundation.runtime import memory, runner
from foundation.machine import MachineConfig


def run():
    g = memory.MemoryGuard(max_ram_mb=100000)                    # huge budget
    assert g.rss_mb() > 0 and g.under_budget() and g.check() > 0
    tiny = memory.MemoryGuard(max_ram_mb=0.0001)                 # fails safe
    try:
        tiny.check()
        raise AssertionError("tiny budget must raise MemoryError")
    except MemoryError:
        pass

    # trigger a single run — paper, reports rss + budget
    rep = runner.run_once()
    assert rep["mode"] == "PAPER" and rep["rss_mb"] > 0 and rep["budget_mb"] > 0

    # autonomous bounded loop (no sleep) -> one report per cycle
    reps = runner.run_loop(cycles=2, sleep=0)
    assert len(reps) == 2 and all("rss_mb" in r for r in reps)

    # memory fail-safe: a tiny budget halts the loop, never OOMs the machine
    halted = runner.run_loop(cfg=MachineConfig({"resources": {"max_ram_mb": 0.0001}}), cycles=3, sleep=0)
    assert halted and halted[-1].get("halted") == "MEMORY"

    print("test_runtime: OK (guard tunable+fail-safe; run_once paper; loop bounded; memory halt)")
    return True


if __name__ == "__main__":
    run()
