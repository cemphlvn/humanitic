"""RLinf training adapter: conforms to the common language, remote-only (not the Mac), registered."""
import sys
from foundation.training.rlinf import RLinfTrainer, RECOMMENDED
from foundation.commons import protocol, registry


def run():
    t = RLinfTrainer()
    assert protocol.conforms(t) and t.kind == "training"
    assert t.config["algo"] == RECOMMENDED["algo"] and t.config["reward"] == "deployment_consistent"
    assert "grpo" in t.describe()["capabilities"]

    # training never runs on the Mac's Metal GPU — remote NVIDIA only
    try:
        t.train()
        raise AssertionError("local train must raise (remote-NVIDIA only)")
    except RuntimeError as e:
        if sys.platform == "darwin":
            assert "Metal" in str(e) or "remote" in str(e).lower()

    # registered as a HUMANITIK-licensed training partner; RoboTwin is the simulator partner
    R = registry.default_register()
    rl = [p for p in R.list(kind="training") if p["id"] == "rlinf"]
    assert rl and rl[0]["license"]["scheme"] == "HUMANITIK"
    assert any(p["id"] == "robotwin" and p["kind"] == "simulator" for p in R.list())

    print("test_training: OK (RLinf conforms, remote-only, HUMANITIK-registered training partner)")
    return True


if __name__ == "__main__":
    run()
