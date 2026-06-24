"""PersonalOS: scaffold (temp dir, never .local), think+run, publish-guarded contribute, independence."""
import os
import json
import tempfile
import numpy as np
from foundation import personal_os
from foundation.operator import vault, trigram_strategy
from foundation.backtest import synthetic


def run():
    # scaffold a personal OS into a TEMP dir (never .local) and check the private layout
    with tempfile.TemporaryDirectory() as tmp:
        root = personal_os.scaffold(os.path.join(tmp, "mine"))
        for d in personal_os.OS_LAYOUT:
            assert os.path.isdir(os.path.join(root, d)), d
        cfg = json.load(open(os.path.join(root, "os.config.json")))
        assert cfg["private"] is True

    # an OS over a (fixture) private vault: think then autonomously run
    os1 = personal_os.PersonalOS(vault.InMemoryVault(trigram_strategy.FIXTURE_TRIGRAMS), owner="alice")
    assert os1.think("AI-capex boom")["action"] == "compile_strategy"
    mkt = synthetic.generate(n_days=1200, seed=7)
    out = os1.run(mkt["prices"])
    assert out["mode"] == "PAPER" and len(os1.calibration) == 1

    # contribute is publish-guarded: clean lesson ships HUMANITIK-licensed; a .local lesson is refused
    assert os1.contribute({"lesson": "mean-reversion survives adverse fills"})["license"] == "HUMANITIK"
    try:
        os1.contribute({"lesson": "see .local/positions.json"})
        raise AssertionError("publish guard must block a .local-tainted lesson")
    except PermissionError:
        pass

    # everyone builds their OWN — two OSes are independent
    os2 = personal_os.PersonalOS(vault.InMemoryVault([["regime:trending", "edge:momentum", "risk:tight"]]),
                                 owner="bob")
    assert os2.owner != os1.owner and os2.vault is not os1.vault

    print("test_personal_os: OK (scaffold layout, think+run, contribute publish-guarded, independent OSes)")
    return True


if __name__ == "__main__":
    run()
