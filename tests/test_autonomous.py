"""The safe autonomous core: paper sessions run, live is hard-gated, the kill-switch trips, stub engine."""
import numpy as np
from foundation.backtest import synthetic
from foundation.operator import autonomous, vault, trigram_strategy, inference


def run():
    mkt = synthetic.generate(n_days=1200, seed=7)
    prices = mkt["prices"]
    v = vault.InMemoryVault(trigram_strategy.FIXTURE_TRIGRAMS)

    # PAPER mode: every strategy is reported (admitted or critic-rejected); admitted ones have equity
    out = autonomous.run_autonomous(v, prices, np.random.default_rng(0))
    assert out["mode"] == "PAPER"
    assert len(out["sessions"]) == len(trigram_strategy.FIXTURE_TRIGRAMS)
    for s in out["sessions"]:
        if s.get("admitted"):
            assert s["final_equity"] > 0 and "mean_tracking_err" in s
        else:
            assert s["verdict"] != "CLEAN"                       # rejected by the critic admission gate

    # LIVE is HARD-GATED: no approval, or a wrong token, both raise
    for bad in (None, "nope"):
        try:
            autonomous.run_autonomous(v, prices, np.random.default_rng(0), live=True, approval=bad)
            raise AssertionError("live must require the explicit human-approval token")
        except PermissionError:
            pass

    # the max-drawdown kill-switch trips on a guaranteed loser (max-long into a steady downtrend)
    class _Loser:
        thesis = "(loser)"
        def target_weight(self, p, t):
            return autonomous.RiskConfig().max_gross
    downtrend = 100.0 * np.exp(np.cumsum(np.full(300, -0.02)))
    rep = autonomous.paper_session(downtrend, _Loser(), np.random.default_rng(0),
                                   risk=autonomous.RiskConfig(max_drawdown=0.10))
    assert rep["halted"] == "DRAWDOWN" and any(k[1] == "DRAWDOWN" for k in rep["kills"])
    assert rep["max_drawdown"] <= -0.10 + 1e-9

    # local inference: default engine is the deterministic offline stub; proposes a schema-valid action
    eng = inference.get_engine()
    assert eng.name == "stub"
    act = eng.propose("AI-capex boom benefits power and grid")
    assert act["action"] == "compile_strategy" and len(act["trigram"]) == 3

    n_adm = sum(1 for s in out["sessions"] if s.get("admitted"))
    print("test_autonomous: OK (%d/%d strategies admitted to paper, live hard-gated, kill-switch trips)"
          % (n_adm, len(out["sessions"])))
    return True


if __name__ == "__main__":
    run()
