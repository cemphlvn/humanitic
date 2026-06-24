"""Power analysis the honest way: know how much data a verdict needs BEFORE collecting it — and admit
when an edge is UNDETECTABLE under the multiple-testing haircut no matter the data (feasible=False)."""
from foundation.eval import power as P


def run():
    # (1) a STRONG IC with FEW trials is feasible with a finite, sensible sample size
    strong = P.observations_needed(0.15, n_trials=3)
    assert strong["feasible"] is True
    assert strong["n_needed"] is not None and 1 < strong["n_needed"] < 100000
    assert strong["sr0"] < 0.15                                # floor below the edge

    # (2) a WEAK IC with MANY trials is INFEASIBLE: the expected-max-under-null floor exceeds the edge
    weak = P.observations_needed(0.02, n_trials=500)
    assert weak["feasible"] is False
    assert weak["n_needed"] is None
    assert weak["sr0"] > 0.02                                  # the haircut swallows the edge

    # (3) more trials => larger sr0 => larger n_needed (monotone), for a fixed FEASIBLE IC
    # (IC chosen above sr0 even at 100 trials, where sr0≈0.253, so every case stays feasible)
    ic = 0.35
    prev_sr0, prev_n = -1.0, 0
    for nt in (1, 5, 20, 100):
        r = P.observations_needed(ic, n_trials=nt)
        assert r["feasible"] is True, (nt, r)
        assert r["sr0"] >= prev_sr0                            # more looks -> higher floor
        assert r["n_needed"] >= prev_n                         # -> more data required
        prev_sr0, prev_n = r["sr0"], r["n_needed"]

    # (4) round-trip: the IC detectable at the recommended N is ≈ the original IC (within ~15%)
    # (each ic above the n_trials=20 floor sr0≈0.190 so it is feasible to begin with)
    for ic in (0.25, 0.35, 0.50):
        n = P.observations_needed(ic, n_trials=20)["n_needed"]
        rt = P.detectable_ic(n, n_trials=20)["min_detectable_ic"]
        assert abs(rt - ic) <= 0.15 * ic, (ic, n, rt)

    # (5) periods_per_year=252 adds the calendar_periods field (here: years of daily data)
    cal = P.observations_needed(0.30, n_trials=10, periods_per_year=252)
    assert "calendar_periods" in cal
    assert abs(cal["calendar_periods"] - cal["n_needed"] / 252) < 0.01

    print("test_power: OK (strong IC/few trials feasible N=%d; weak IC/many trials INFEASIBLE "
          "sr0=%.3f>0.02; trials↑ => sr0↑ => N↑; round-trip detectable_ic≈ic; calendar=%.2fy)"
          % (strong["n_needed"], weak["sr0"], cal["calendar_periods"]))
    return True


if __name__ == "__main__":
    run()
