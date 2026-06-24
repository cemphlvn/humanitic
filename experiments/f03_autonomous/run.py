"""
f03 — the safe autonomous core, end to end: a local-inference STUB proposes a strategy, the vault of
(public-fixture) trigram IP is admitted through the critic, paper-traded with the full risk-gate
stack, and the LIVE switch is shown to be hard-gated. PAPER only; no live capital. Offline, numpy.

    PYTHONPATH=. python3 experiments/f03_autonomous/run.py
"""
import numpy as np
from foundation.backtest import synthetic
from foundation.operator import autonomous, vault, trigram_strategy, inference


def main():
    mkt = synthetic.generate(n_days=1500, seed=7)
    prices = mkt["prices"]

    eng = inference.get_engine()                                  # offline stub by default
    proposal = eng.propose("AI-capex boom benefits power, grid, cooling")
    print("f03 — autonomous core  (engine=%s, mode=PAPER)" % eng.name)
    print("  operator proposes:", proposal["trigram"], "-", proposal["rationale"])

    v = vault.InMemoryVault(trigram_strategy.FIXTURE_TRIGRAMS)    # .local IP, stood-in by fixtures
    out = autonomous.run_autonomous(v, prices, np.random.default_rng(0))
    for s in out["sessions"]:
        tg = "·".join(s["trigram"])
        if s.get("admitted"):
            print("  [ADMIT] %-46s equity %.3f  maxDD %+.3f  trackErr %.3f  kills=%d"
                  % (tg, s["final_equity"], s["max_drawdown"], s["mean_tracking_err"], len(s["kills"])))
        else:
            print("  [REJECT %-9s] %s" % (s["verdict"], tg))

    print("\n  LIVE switch:")
    try:
        autonomous.run_autonomous(v, prices, np.random.default_rng(0), live=True)
    except PermissionError as e:
        print("  refused ->", e)
    print("  (live requires the explicit human-approval token; staged escalation synthetic->paper->live)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
