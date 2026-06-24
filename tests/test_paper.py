"""Paper trading (simulated money) ledger + the time-interval-infra-fit sweep (Deflated-Sharpe-judged)."""
import numpy as np

from foundation.execution.paper_account import PaperAccount
from foundation.eval import interval_fit
from foundation.regime import unsupervised


def run():
    # paper account: equity compounds, drawdown tracked, summary is PAPER, ledger round-trips
    a = PaperAccount(100_000.0)
    s = a.run([1.0, 1.0, -1.0], [0.01, -0.005, 0.02])
    assert s["n_steps"] == 3 and "PAPER" in s["mode"] and 0.0 <= s["max_drawdown"] <= 1.0
    assert a.equity != 100_000.0
    b = PaperAccount.from_dict(a.to_dict())
    assert abs(b.equity - a.equity) < 1e-6 and b.n_steps == a.n_steps

    # interval fit: sweep, infeasible flagged, best chosen by Deflated Sharpe (n_trials = #feasible)
    feat, fwd, _ = unsupervised.synth_regime_world(n=2000, seed=0)
    pos, r, _ = unsupervised.dynamic_trade(feat, fwd, seed=0)
    res = interval_fit.fit(pos, r, intervals=(1, 2, 4, 8, 16, 400))
    assert len(res["intervals"]) == 6
    assert any(x.get("feasible") is False for x in res["intervals"])     # interval=400 -> too few bars
    assert res["best_fit"] is not None and res["best_fit"]["feasible"]
    assert res["n_trials"] >= 1

    print("test_paper: OK (paper ledger equity/drawdown + round-trip; interval-fit best=%s by DSR, n_trials=%d)"
          % (res["best_fit"]["interval"], res["n_trials"]))
    return True


if __name__ == "__main__":
    run()
