"""Time-mapped robotic stream aligned to crypto-project dynamics (causal as-of), then analyzed."""
from foundation.data import align, crypto, sources
from foundation.eval import prequential


def run():
    cd = crypto.crypto_dynamics(n=900, seed=3)               # crypto project dynamics, irregular clock
    t_r, robot = crypto.robot_track(cd, seed=4)               # time-mapped robotic data stream, own clock

    # TIME-MAP: align each robot frame to the most-recent crypto frame (causal as-of; no lookahead)
    idx = align.asof_align(t_r, cd["t"], tolerance=5.0)
    align.assert_causal(t_r, cd["t"], idx)
    keep = idx >= 0
    assert keep.sum() > 300

    # aligned cross-domain analysis: (robot state + crypto event) -> next crypto regime, prequential
    k = idx[keep]
    arr = (robot[keep], cd["event"][k], cd["next_latent"][k], cd["regime"][k], cd["regime_next"][k])
    res = prequential.prequential_eval(arr, cd["L"], warmup=120, refit_every=20)
    assert res["prequential_acc"] > res["persistence"] + 0.05

    cs = sources.by_modality("crypto")                        # crypto sources are open
    assert cs and all(s.license in ("open", "public-domain") for s in cs)

    print("test_align_crypto: OK (time-mapped causal align %d frames; crypto dynamics; acc %.2f vs %.2f; %.0f bits)"
          % (keep.sum(), res["prequential_acc"], res["persistence"], res["skill_bits_total"]))
    return True


if __name__ == "__main__":
    run()
