"""
test_critic — the AGENT-CRITIC / deployment-gap audit (Exp 4).

The critic is the validator/evaluator role: it audits a strategy for the hazards that make a
beautiful backtest lie in live trading. We prove it by feeding it KNOWN-bad and KNOWN-good
strategies and asserting the verdict, the per-check statuses, and determinism.

Run:  PYTHONPATH=. python3 tests/test_critic.py
"""
import numpy as np

from foundation.backtest import synthetic
from foundation.operator import baselines
from foundation.operator import trigram_strategy
from foundation.operator import critic


class AlternatingOverlevered:
    """A deliberately broken test strategy: gross 1.0 (no cap) flipping +1/-1 EVERY step.

    Concentration: |w|=1.0 > a 0.5 max_gross. Turnover: |w_t - w_{t-1}| = 2.0 every step ->
    mean turnover 2.0 > a 1.0 ceiling. Causal (uses only t), so it is NOT leaky — this isolates
    the concentration/turnover hazards from the look-ahead one."""

    def target_weight(self, prices, t):
        return 1.0 if (t % 2 == 0) else -1.0


def _status(report, name):
    for c in report["checks"]:
        if c["name"] == name:
            return c["status"]
    raise AssertionError("no check named %r in report" % name)


def run():
    mkt = synthetic.generate(n_days=800, seed=7)
    prices = mkt["prices"]

    # 1) LEAKY strategy -> FLAGGED, look_ahead flagged, backtest-dependent check skipped.
    leak_rep = critic.audit(baselines.leaky_oracle(), prices, np.random.default_rng(0))
    assert leak_rep["verdict"] == "FLAGGED", leak_rep
    assert _status(leak_rep, "look_ahead") == "flag", leak_rep
    assert _status(leak_rep, "regime_brittleness") == "skip", leak_rep

    # 2) OVER-LEVERED / HIGH-TURNOVER strategy -> FLAGGED on concentration AND/OR turnover.
    lev_rep = critic.audit(AlternatingOverlevered(), prices, np.random.default_rng(0),
                           max_gross=0.5, max_turnover=1.0)
    assert lev_rep["verdict"] == "FLAGGED", lev_rep
    assert (_status(lev_rep, "position_concentration") == "flag"
            or _status(lev_rep, "turnover_explosion") == "flag"), lev_rep
    # this one is causal, so it must NOT be flagged for look-ahead
    assert _status(lev_rep, "look_ahead") == "pass", lev_rep

    # 3) CLEAN conservative trigram strategy: tight cap 0.15 <= max_gross, declared point-in-time,
    #    realistic 5 bps. look_ahead, position_concentration, survivorship MUST all pass. It may
    #    still be FLAGGED on regime_brittleness if the OOS edge is weak — that is honest.
    conservative = trigram_strategy.decode(
        ["regime:meanrev", "edge:mean_reversion", "risk:tight"])
    clean_rep = critic.audit(conservative, prices, np.random.default_rng(0),
                             cost_bps=5.0, point_in_time=True)
    assert _status(clean_rep, "look_ahead") == "pass", clean_rep
    assert _status(clean_rep, "position_concentration") == "pass", clean_rep
    assert _status(clean_rep, "survivorship") == "pass", clean_rep

    # 4) DETERMINISM: identical inputs -> identical verdict (and identical check statuses).
    a = critic.audit(conservative, prices, np.random.default_rng(0),
                     cost_bps=5.0, point_in_time=True)
    b = critic.audit(conservative, prices, np.random.default_rng(0),
                     cost_bps=5.0, point_in_time=True)
    assert a["verdict"] == b["verdict"], (a["verdict"], b["verdict"])
    assert [c["status"] for c in a["checks"]] == [c["status"] for c in b["checks"]], (a, b)

    print("test_critic: OK (leaky=%s, levered=%s, conservative=%s)"
          % (leak_rep["verdict"], lev_rep["verdict"], clean_rep["verdict"]))
    return True


if __name__ == "__main__":
    run()
