"""Paper trading (simulated money) ledger + the time-interval-infra-fit sweep (Deflated-Sharpe-judged)."""
import numpy as np

from foundation.execution.paper_account import PaperAccount
from foundation.eval import interval_fit
from foundation.regime import unsupervised
from foundation.runtime import paper


def run():
    # paper account: equity compounds, drawdown tracked, summary is PAPER, ledger round-trips (incl interval)
    a = PaperAccount(100_000.0, interval=4)
    s = a.run([1.0, 1.0, -1.0], [0.01, -0.005, 0.02])
    assert s["n_steps"] == 3 and "PAPER" in s["mode"] and 0.0 <= s["max_drawdown"] <= 1.0
    assert s["interval"] == 4 and a.equity != 100_000.0
    b = PaperAccount.from_dict(a.to_dict())
    assert abs(b.equity - a.equity) < 1e-6 and b.n_steps == a.n_steps and b.interval == 4

    # interval fit: sweep, infeasible flagged, best chosen by Deflated Sharpe (n_trials = #feasible)
    feat, fwd, _ = unsupervised.synth_regime_world(n=2000, seed=0)
    pos, r, _ = unsupervised.dynamic_trade(feat, fwd, seed=0)
    res = interval_fit.fit(pos, r, intervals=(1, 2, 4, 8, 16, 400))
    assert len(res["intervals"]) == 6
    assert any(x.get("feasible") is False for x in res["intervals"])     # interval=400 -> too few bars
    assert res["best_fit"] is not None and res["best_fit"]["feasible"]
    assert res["n_trials"] >= 1

    # the chosen interval is WIRED onto the paper account: it picks an interval and trades at it
    rep = paper.run_paper(write_local=False)
    assert rep["interval"] >= 1 and rep["n_steps"] > 0
    assert "interval_chosen" in rep and rep["interval_chosen"]["interval"] == rep["interval"]

    print("test_paper: OK (ledger+interval round-trip; interval-fit best=%s; paper trades fitted interval=%s)"
          % (res["best_fit"]["interval"], rep["interval"]))
    return True


if __name__ == "__main__":
    run()
