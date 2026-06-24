"""The identifying-questions rubric: weights sum to 1; strong scores high; an auto-DQ zeroes it."""
from foundation.data import screening


def run():
    assert abs(sum(d["weight"] for d in screening.DIMENSIONS) - 1.0) < 1e-9
    assert len(screening.all_questions()) >= 20

    strong = {d["key"]: [3] * len(d["questions"]) for d in screening.DIMENSIONS}
    r = screening.score(strong)
    assert r["score"] > 95 and r["verdict"] == "STRONG" and not r["disqualified"]

    weak = {d["key"]: [1] * len(d["questions"]) for d in screening.DIMENSIONS}
    assert screening.score(weak)["verdict"] in ("DISQUALIFIED", "LONG_SHOT")

    # an auto-disqualifier zeroes even an otherwise-strong candidate (the refutation gate)
    dq = screening.score(strong, disqualifiers={"block_timestamp_only"})
    assert dq["score"] == 0.0 and dq["verdict"] == "DISQUALIFIED" and dq["disqualified"]

    print("test_screening: OK (%d questions, 7 weighted dims; strong=%.0f; auto-DQ zeroes)"
          % (len(screening.all_questions()), r["score"]))
    return True


if __name__ == "__main__":
    run()
