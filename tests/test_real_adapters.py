"""Real adapters (Hivemapper ODC, GEODNET NTRIP): conform, network-guarded; replay -> causal as-of join."""
from foundation.data.adapters import hivemapper, geodnet
from foundation.runtime import realjoin
from foundation.commons import protocol


def run():
    hv = hivemapper.HivemapperODC(base_url=None)
    assert protocol.conforms(hv) and hv.kind == "data"
    try:
        hv.gps()
        raise AssertionError("hivemapper must raise when unconfigured")
    except RuntimeError:
        pass

    gd = geodnet.GeodnetNTRIP(caster=None, mountpoint=None)
    assert protocol.conforms(gd) and gd.kind == "data"
    try:
        gd.stream()
        raise AssertionError("geodnet must raise when unconfigured")
    except RuntimeError:
        pass

    # offline floor: real-schema replay -> activity/throughput -> causal as-of join, both targets
    for target in ("hivemapper", "geodnet"):
        rep = realjoin.replay_join(target)
        assert rep["causal"] and rep["aligned"] > 40
        assert rep["lead_lag"]["corr"] is not None and rep["lead_lag"]["corr"] > 0.2

    print("test_real_adapters: OK (hivemapper+geodnet conform & network-guarded; replay as-of join causal)")
    return True


if __name__ == "__main__":
    run()
