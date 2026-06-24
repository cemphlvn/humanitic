"""
test_index_props — recall-robustness property tests for the local knowledge index.

We push the encode -> store -> retrieve pipeline: the FACTOR_CAP capacity gate, the
Article 0 gate at .add()'s door, exact self-recall over many random regimes, partial-
query recall, cross-process determinism of symbol()/encode_regime(), and a report-only
COMPUTATIONAL probe of the `bundle` capacity envelope (the LABNOTES wall: "store factors
not items") — where recall starts to degrade as k bound pairs pile into one bundle.

Run:  PYTHONPATH=. python3 tests/test_index_props.py
"""
import json
import numpy as np
from foundation.index import store
from foundation.kernel import vsa


def test_factor_cap_enforced():
    # FACTOR_CAP factors is fine; one more is a ValueError.
    store.encode_regime([f"f{i}:lvl{i}" for i in range(store.FACTOR_CAP)])
    try:
        store.encode_regime([f"f{i}:lvl{i}" for i in range(store.FACTOR_CAP + 1)])
        raise AssertionError(f"{store.FACTOR_CAP + 1} factors must exceed FACTOR_CAP")
    except ValueError:
        pass
    assert store.FACTOR_CAP == 16, store.FACTOR_CAP
    print(f"  FACTOR_CAP: {store.FACTOR_CAP} ok, {store.FACTOR_CAP + 1} rejected")


def test_article0_gate_at_add():
    ix = store.Index()
    # an entry whose serialized content carries a .local path token cannot enter the commons
    for content in [".local/positions.json", "see .local for state", "a/b/.local/x"]:
        try:
            ix.add({"id": "bad", "kind": "regime", "regime_factors": ["a:b"],
                    "provenance": "public", "content": content})
            raise AssertionError(f"add must block .local content {content!r}")
        except PermissionError:
            pass
    # a PRIVATE:: marker is blocked too
    try:
        ix.add({"id": "bad2", "regime_factors": ["a:b"], "note": "PRIVATE::weights"})
        raise AssertionError("add must block PRIVATE:: content")
    except PermissionError:
        pass
    assert ix.entries == [], "no tainted entry may have been stored"
    print("  Article 0 gate: .local and PRIVATE:: entries refused at .add()")


def _random_regimes(n, rng):
    """n entries, each 3-8 factors with UNIQUE feature names (so regimes are distinct)."""
    feats = [f"feat{i}" for i in range(200)]
    lvls = ["low", "mid", "high", "rising", "falling", "tight", "ample", "wide"]
    regimes = []
    used_keys = set()
    while len(regimes) < n:
        m = int(rng.integers(3, 9))           # 3..8 inclusive
        chosen = rng.choice(len(feats), size=m, replace=False)
        factors = sorted(f"{feats[j]}:{lvls[int(rng.integers(0, len(lvls)))]}" for j in chosen)
        key = tuple(factors)
        if key in used_keys:
            continue
        used_keys.add(key)
        regimes.append({"id": f"r{len(regimes)}", "regime_factors": factors,
                        "provenance": "public", "contributor": "test"})
    return regimes


def test_roundtrip_self_recall():
    rng = np.random.default_rng(7)
    regimes = _random_regimes(12, rng)            # >= 10 distinct
    ix = store.Index()
    for r in regimes:
        ix.add(r)
    for r in regimes:
        top = ix.retrieve(r["regime_factors"], k=1)
        assert top[0][0] == r["id"], f"self-recall failed for {r['id']}: top={top}"
        assert top[0][1] > 0.5, f"self-sim suspiciously low for {r['id']}: {top}"
    print(f"  round-trip: {len(regimes)} distinct regimes each self-recall at k=1")


def test_partial_query_recall():
    rng = np.random.default_rng(11)
    ix = store.Index()
    # the target: a 4-factor regime with unique features
    target = {"id": "target", "regime_factors":
              ["inflation:high", "rates:rising", "dollar:strong", "credit:widening"],
              "provenance": "public"}
    ix.add(target)
    # distractors that share NO features with the target
    for r in _random_regimes(15, rng):
        r["id"] = "d_" + r["id"]
        ix.add(r)
    # a 2-of-4 subset query must still return the target first
    for subset in [["inflation:high", "rates:rising"],
                   ["dollar:strong", "credit:widening"],
                   ["rates:rising", "credit:widening"]]:
        top = ix.retrieve(subset, k=3)
        assert top[0][0] == "target", f"partial query {subset} did not recall target: {top}"
    print("  partial-query: 2-of-4 subsets each recall the 4-factor target first")


def test_determinism():
    # symbol() is sha256-seeded -> identical across calls (and processes)
    a, b = store.symbol("x"), store.symbol("x")
    assert np.array_equal(a, b), "symbol('x') must be deterministic"
    assert not np.array_equal(store.symbol("x"), store.symbol("y")), "distinct names differ"
    # encode_regime is a pure function of its factors
    factors = ["regime:inflationary", "edge:momentum", "risk:capped"]
    v1, v2 = store.encode_regime(factors), store.encode_regime(factors)
    assert vsa.similarity(v1, v2) > 0.999, vsa.similarity(v1, v2)
    # order-insensitivity is a property of bundle (sum) — a nice extra refutation target
    v3 = store.encode_regime(list(reversed(factors)))
    assert vsa.similarity(v1, v3) > 0.999, ("encode_regime should be order-insensitive", vsa.similarity(v1, v3))
    print("  determinism: symbol() stable, encode_regime() self-sim ~1.0 (order-insensitive)")


def test_bundle_capacity_wall():
    """Report-only probe of the `bundle` capacity envelope (the wall lives in bundle()).

    Bundle k bound (role<->filler) pairs into one memory, then for each stored filler ask:
    does unbinding its role recover IT (nearest in a codebook) over a field of distractors?
    Recall is high at small k and degrades as k grows past the envelope. We PRINT the curve
    and only hard-assert the small-k end (the regime the index actually operates in).
    """
    rng = np.random.default_rng(3)
    D = store.D
    n_distract = 512                  # heavy distractor field, to surface the wall
    trials = 25
    curve = {}
    for k in [2, 4, 8, 16, 32, 64, 128, 256, 512]:
        hits = 0
        total = 0
        for _ in range(trials):
            roles = [vsa.rand_hv(D, rng) for _ in range(k)]
            fillers = [vsa.rand_hv(D, rng) for _ in range(k)]
            mem = vsa.bundle([vsa.bind(roles[i], fillers[i]) for i in range(k)])
            # codebook: the true fillers + a field of distractors
            distract = [vsa.rand_hv(D, rng) for _ in range(n_distract)]
            book = np.stack(fillers + distract)
            for i in range(k):
                query = mem * np.conj(roles[i])           # unbind role i
                idx, _ = vsa.cleanup(query, book, k=1)
                if int(idx[0]) == i:                        # recovered the right filler
                    hits += 1
                total += 1
        recall = hits / total
        curve[k] = recall
    print("  bundle capacity wall (recall vs k bound pairs, D=%d, %d distractors):" % (D, n_distract))
    wall = None
    for k in sorted(curve):
        flag = "" if curve[k] >= 0.95 else ("  <- degrading" if curve[k] >= 0.5 else "  <- WALL")
        if wall is None and curve[k] < 0.9:
            wall = k
        print(f"    k={k:>3}: recall={curve[k]:.3f}{flag}")
    if wall is not None:
        print(f"  empirical bundle wall: recall first drops below 0.9 at k={wall} "
              f"(store factors not items)")
    else:
        print("  empirical bundle wall: recall stayed >=0.9 through k=64 in this probe")
    # hard assert only the regime the index lives in: small k must be ~perfect
    assert curve[2] >= 0.99, ("small-k recall must be near-perfect", curve)
    assert curve[4] >= 0.95, ("k=4 recall must be high", curve)
    # and FACTOR_CAP (16) must still be usable, not collapsed
    assert curve[16] >= 0.5, ("recall at FACTOR_CAP collapsed unexpectedly", curve)


def run():
    test_factor_cap_enforced()
    test_article0_gate_at_add()
    test_roundtrip_self_recall()
    test_partial_query_recall()
    test_determinism()
    test_bundle_capacity_wall()
    print("test_index_props: OK")
    return True


if __name__ == "__main__":
    run()
