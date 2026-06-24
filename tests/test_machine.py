"""MachineConfig: defaults when none declared; a declared file deep-merges; secrets backend selection."""
import os
import json
import tempfile
import shutil
from foundation.machine import MachineConfig


def run():
    # no declared file -> defaults
    cfg = MachineConfig.load("/nonexistent/ark.machine.yaml")
    assert cfg.engine == "stub" and cfg.broker == "paper" and cfg.risk == "conservative"
    assert cfg.network == "base-sepolia"

    # a declared file deep-merges over the defaults (untouched keys preserved)
    d = tempfile.mkdtemp()
    p = os.path.join(d, "ark.machine.json")
    json.dump({"machine": "rig", "inference": {"engine": "mlx"}, "execution": {"broker": "cdp"}},
              open(p, "w"))
    cfg2 = MachineConfig.load(p)
    assert cfg2.engine == "mlx" and cfg2.broker == "cdp" and cfg2.risk == "conservative"
    assert cfg2.get("machine") == "rig"

    # the secrets backend follows the declared config
    assert MachineConfig({"secrets": {"backend": "env"}}).secrets_vault().backend.name == "env"
    assert MachineConfig.load("/nonexistent").secrets_vault().backend.name in ("keychain", "env")

    shutil.rmtree(d, ignore_errors=True)
    print("test_machine: OK (defaults, deep-merge, declared secret-backend selection)")
    return True


if __name__ == "__main__":
    run()
