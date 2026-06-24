"""Streaming + research-grade evals on OPEN protocols: paired stream, walk-forward allocation (no
leakage), prequential test-then-train online training, measurement in bits under the capacity wall."""
from foundation.data import stream, sources
from foundation.eval import prequential


def run():
    st, L = stream.paired_replay(n=700, R=4, d=48, p_event=0.3, seed=2)
    assert len(st) == 700

    # research-grade SOURCE ALLOCATION (open: Croissant/RLDS/OpenLineage) + walk-forward, no leakage
    assert sources.by_modality("robot") and sources.by_modality("market")
    split = sources.allocate_walkforward(len(st), 0.6, 0.2, 0.2)
    sources.assert_no_leakage(split)            # raises if any future leaks into the past

    # train the system ONLINE and MEASURE it prequentially (test-then-train)
    res = prequential.prequential_eval(st.arrays(), L, warmup=140, refit_every=20)
    assert res["prequential_acc"] > res["persistence"] + 0.08        # online training beats the baseline
    assert res["skill_bits_total"] > 0 and not res["capacity_exceeded"]   # edge in bits, under the wall

    print("test_stream_eval: OK (open prequential; acc %.2f vs persistence %.2f; skill %.1f bits; no leakage)"
          % (res["prequential_acc"], res["persistence"], res["skill_bits_total"]))
    return True


if __name__ == "__main__":
    run()
