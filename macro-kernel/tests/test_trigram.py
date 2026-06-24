"""Conceptual trigrams: encode, the probe crossing, novelty, the 5% foundation cost, Article 0."""
import numpy as np
from foundation.index import trigram
from foundation.kernel import vsa


def _sim(a, b):
    return float(np.mean(np.real(a * np.conj(b))))


def run():
    # deterministic + exactly three lines
    t1 = trigram.encode_trigram(["regime:inflationary", "edge:momentum", "risk:capped"])
    t2 = trigram.encode_trigram(["regime:inflationary", "edge:momentum", "risk:capped"])
    assert _sim(t1, t2) > 0.999
    try:
        trigram.encode_trigram(["a", "b"])
        raise AssertionError("a trigram must be exactly three concepts")
    except ValueError:
        pass

    # the probe maps a fuzzy semantic blend onto the three public concepts
    vocab = ["regime:inflationary", "edge:momentum", "risk:capped",
             "regime:risk_off", "edge:carry", "vol:high"]
    target = ["regime:inflationary", "edge:momentum", "risk:capped"]
    sem = vsa.bundle([trigram._concept_hv(c) for c in target])
    assert set(trigram.probe(sem, vocab, k=3)) == set(target)

    # novelty: a duplicate maps no new territory (~0); a fresh triple maps new territory (~1)
    assert trigram.novelty(t1, [t1]) < 0.2
    fresh = trigram.encode_trigram(["regime:risk_off", "edge:carry", "vol:high"])
    assert trigram.novelty(fresh, [t1]) > 0.7

    # the 5% foundation cost; the split conserves value
    s = trigram.reward_split(1.0)
    assert abs(s["foundation"] - 0.05) < 1e-9
    assert abs(s["cartographer"] + s["foundation"] - 1.0) < 1e-9

    # the contribution record is Article 0-clean; a .local-tainted concept is blocked
    rec, _ = trigram.contribution(target, "cartographer:anon", [])
    assert rec["provenance"] == "public" and rec["novelty"] >= 0.0
    try:
        trigram.contribution([".local/secret", "edge:momentum", "risk:capped"], "x", [])
        raise AssertionError("publish guard must block .local content")
    except PermissionError:
        pass
    print("test_trigram: OK")
    return True


if __name__ == "__main__":
    run()
