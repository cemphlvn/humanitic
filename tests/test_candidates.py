"""Candidate projects scored through the screening rubric — verdicts computed, not asserted."""
from foundation.data import candidates


def run():
    assert len(candidates.CANDIDATES) >= 12

    # the research's NO example trips an automatic disqualifier (no cryptographic provenance)
    assert candidates.screen("xmaquina")["verdict"] == "DISQUALIFIED"
    assert candidates.screen("xmaquina")["score"] == 0.0

    # the operationally-ready targets clear the gates
    for cid in ("geodnet", "hivemapper", "peaq"):
        assert candidates.screen(cid)["verdict"] in ("CONDITIONAL", "STRONG")

    # GEODNET (most operationally ready) tops the ranking and outscores the conceptual play
    r = candidates.ranked()
    score = {cid: s for cid, s, v in r}
    assert r[0][0] == "geodnet"
    assert score["geodnet"] > score["xmaquina"]

    print("test_candidates: OK (%d candidates; top=%s %.0f %s; xmaquina DISQUALIFIED)"
          % (len(candidates.CANDIDATES), r[0][0], r[0][1], r[0][2]))
    return True


if __name__ == "__main__":
    run()
