"""The regime kernel fused across domains: VSA encode + JEPA work on embodied latents; VLA policies."""
from foundation.regime import embodied, jepa
from foundation.index import store
from foundation.operator import vla
from foundation.commons import protocol, registry


def run():
    # the SAME VSA encode used for market regimes encodes an embodied state
    v = embodied.encode_embodied(["phase:reach", "gripper:open", "object:detected"])
    assert v.shape[0] == store.D

    # the SAME JEPA predicts embodied (VLA-like) latent transitions, beating persistence
    lt, ev, ln, lab_t, lab_n, L = embodied.embodied_world_model(n=600, seed=1)
    ntr = 450
    W = embodied.fuse_vla_jepa(lt[:ntr], ev[:ntr], ln[:ntr])
    acc = jepa.evaluate(W, lt[ntr:], ev[ntr:], lab_n[ntr:], L)
    base = jepa.persistence_accuracy(lab_t[ntr:], lab_n[ntr:])
    assert acc >= base + 0.10, (acc, base)

    # VLA policies (Pi0/Gr00t/OpenVLA) speak the common language, run remote-only, are registered
    p = vla.Pi0()
    assert protocol.conforms(p) and p.kind == "policy"
    try:
        p.act()
        raise AssertionError("a VLA policy on the Mac must raise (remote GPU)")
    except RuntimeError:
        pass
    assert {"pi0", "gr00t", "openvla"} <= {x["id"] for x in registry.default_register().list(kind="policy")}

    print("test_embodied: OK (VSA encode + JEPA fuse embodied latents %.2f vs persistence %.2f; "
          "VLA policies remote-only, registered)" % (acc, base))
    return True


if __name__ == "__main__":
    run()
