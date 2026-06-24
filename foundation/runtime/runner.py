"""
runner — run the macro-kernel on YOUR machine: TRIGGERABLE (`run_once`) and/or AUTONOMOUS (`run_loop`,
a bounded loop). Local-safe (paper-only, every edge gated), memory-safe (a tunable RAM budget enforced
each cycle; the loop FAILS SAFE and halts rather than OOM), tunable (interval + budget + engine/broker
from the machine config). The real vault is `LocalVault('.local/vault')` at runtime; here we default to
public fixtures.
"""
import time
import numpy as np

from foundation.machine import MachineConfig
from foundation.runtime.memory import MemoryGuard
from foundation.operator import vault as vault_mod, autonomous, trigram_strategy
from foundation.data.adapter import SyntheticSource


def _market(seed):
    return SyntheticSource(n_days=1500, seed=seed).prices()


def run_once(cfg=None, vault=None, seed=0, prices=None):
    cfg = cfg or MachineConfig.load()
    guard = MemoryGuard(cfg.get("resources", "max_ram_mb", default=2048))
    guard.collect()
    guard.check()
    v = vault if vault is not None else vault_mod.InMemoryVault(trigram_strategy.FIXTURE_TRIGRAMS)
    p = prices if prices is not None else _market(seed)
    out = autonomous.run_autonomous(v, p, np.random.default_rng(seed), risk=autonomous.RiskConfig())
    return {"mode": out["mode"], "sessions": len(out["sessions"]),
            "rss_mb": round(guard.check(), 1), "budget_mb": guard.max_ram_mb}


def run_loop(cfg=None, vault=None, cycles=None, sleep=None, on_cycle=None):
    """Autonomous bounded loop. Each cycle: gc -> run_once -> sleep. Fails safe on RAM (halts)."""
    cfg = cfg or MachineConfig.load()
    interval = sleep if sleep is not None else cfg.get("resources", "interval_seconds", default=300)
    guard = MemoryGuard(cfg.get("resources", "max_ram_mb", default=2048))
    reports = []
    n = 0
    while cycles is None or n < cycles:
        guard.collect()
        try:
            rep = run_once(cfg, vault, seed=n)
        except MemoryError as e:
            reports.append({"cycle": n, "halted": "MEMORY", "detail": str(e)})
            break                                                # fail-safe: stop, don't OOM the machine
        rep["cycle"] = n
        reports.append(rep)
        if on_cycle:
            on_cycle(rep)
        n += 1
        if cycles is not None and n >= cycles:
            break
        time.sleep(interval)
    return reports
