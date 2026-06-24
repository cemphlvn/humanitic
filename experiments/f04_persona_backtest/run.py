"""
f04 — backtest on NEMOTRON-ALIKE synthetic data, end to end. Synthetic personas drive the sentiment
that drives the regime that drives the market; ark's safe autonomous core paper-trades it, and the
strategy is back-tested ACROSS broker partners. The human-behavior latent engine, all offline, numpy.

    PYTHONPATH=. python3 experiments/f04_persona_backtest/run.py
"""
import numpy as np
from foundation.data.adapter import PersonaSource
from foundation.operator import trigram_strategy, vault, autonomous
from foundation.execution import cross_broker


def main():
    src = PersonaSource(n_days=1500, n_personas=3000, seed=7)
    prices = src.prices()
    print("f04 — backtest on nemotron-alike persona-driven synthetic data")
    print("  %d synthetic personas -> sentiment -> regimes %s -> %d-day market"
          % (src._d["n_personas"], src._d["regime_names"], len(prices)))

    v = vault.InMemoryVault(trigram_strategy.FIXTURE_TRIGRAMS)
    out = autonomous.run_autonomous(v, prices, np.random.default_rng(0))
    for s in out["sessions"]:
        tg = "·".join(s["trigram"])
        if s.get("admitted"):
            print("  [ADMIT ] %-46s equity %.3f  maxDD %+.3f  kills=%d"
                  % (tg, s["final_equity"], s["max_drawdown"], len(s["kills"])))
        else:
            print("  [REJECT %-9s] %s" % (s["verdict"], tg))

    strat = trigram_strategy.decode(["regime:risk_off", "edge:mean_reversion", "risk:tight"])
    bx = cross_broker.backtest_across(prices, strat)
    print("  backtest-across partners: equity spread %.4f  robust=%s"
          % (bx["equity_spread"], bx["robust"]))
    print("  -> backtested on synthetic human behavior, honestly, with live capital hard-gated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
