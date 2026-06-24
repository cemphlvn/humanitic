"""FrodoBots pace-of-place thesis: walking speed/dynamics/time-of-day -> predict the area's local market."""
from foundation.data.adapters import frodobots
from foundation.regime import pace_of_place as pop
from foundation.commons import protocol


def run():
    fb = frodobots.FrodoBots2K(path=None)
    assert protocol.conforms(fb) and fb.kind == "data"
    try:
        fb.frames()
        raise AssertionError("frodobots must raise when unconfigured")
    except RuntimeError:
        pass

    frames = frodobots.FrodoBots2K.demo_fixture(city="berkeley")
    t, pace, dyn, tod = pop.pace_features(frames, window_s=600)
    assert len(t) > 30 and pace.min() >= 0 and pace.std() > 0       # walking speed varies by time-of-day
    assert tod.min() >= 0 and tod.max() < 24

    # the thesis: pace LEADS the area's local market; forecast it
    rep = pop.predict_local_market(t, pace, seed=1)
    assert rep["causal"] and rep["aligned"] > 30
    assert rep["lead_lag"]["corr"] > 0.4 and rep["lead_lag"]["lag"] >= 1
    assert rep["forecast_skill"] > 0       # pace beats persistence at nowcasting the local market

    print("test_pace_of_place: OK (pace/dynamics/tod -> local-market lead %d, corr %.2f, skill %.2f)"
          % (rep["lead_lag"]["lag"], rep["lead_lag"]["corr"], rep["forecast_skill"]))
    return True


if __name__ == "__main__":
    run()
