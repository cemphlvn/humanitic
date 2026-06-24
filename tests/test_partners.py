"""HUMANITIK-licensed partner register + backtest-across broker adapters."""
import numpy as np
from foundation.commons import registry
from foundation.execution import broker, cross_broker
from foundation.operator import trigram_strategy
from foundation.backtest import synthetic


def run():
    R = registry.default_register()
    # every partner carries a HUMANITIK license: attribution + the 5% foundation cost + privacy terms
    for p in R.list():
        lic = p["license"]
        assert lic["scheme"] == "HUMANITIK" and lic["attribution"], p
        assert abs(lic["foundation_cost"] - 0.05) < 1e-9, p
    assert len(R.list(kind="broker")) >= 2 and len(R.list(kind="inference")) >= 1
    assert len(R.list(kind="data")) >= 1

    # registration is REFUSED without a HUMANITIK license
    try:
        R.register({"id": "x", "kind": "broker", "license": {"scheme": "MIT"}})
        raise AssertionError("must require a HUMANITIK license with attribution")
    except ValueError:
        pass

    # backtest ACROSS broker profiles: one strategy, every supported partner's execution model
    mkt = synthetic.generate(n_days=1200, seed=7)
    strat = trigram_strategy.decode(["regime:meanrev", "edge:mean_reversion", "risk:tight"])
    out = cross_broker.backtest_across(mkt["prices"], strat)
    assert len(out["per_broker"]) == len(broker.PROFILES)
    assert all("final_equity" in r and "broker" in r for r in out["per_broker"])
    assert out["equity_spread"] >= 0.0 and isinstance(out["robust"], bool)

    # a runtime broker adapter raises offline (needs credentials + the human-approved live gate)
    try:
        broker.AlpacaAdapter().step(0.1, 0.0)
        raise AssertionError("runtime adapter must raise offline")
    except RuntimeError:
        pass

    print("test_partners: OK (%d partners HUMANITIK-licensed; across %d brokers, spread %.4f, robust=%s)"
          % (len(R.list()), len(out["per_broker"]), out["equity_spread"], out["robust"]))
    return True


if __name__ == "__main__":
    run()
