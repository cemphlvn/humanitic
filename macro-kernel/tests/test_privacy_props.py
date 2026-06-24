"""
test_privacy_props — adversarial property tests for Article 0 (the eternity clause).

Refutation ethos: we TRY to leak. Every `.local`-bearing artifact, in every form the
guard claims to catch, MUST be refused; every clean artifact MUST pass. We also exercise
the only sanctioned outbound path (publish), the trigram contribution gate, the conserving
reward split, novelty bounds, the exactly-three trigram law, and probe recovery under noise.

Run:  PYTHONPATH=. python3 tests/test_privacy_props.py
"""
import json
import numpy as np
from foundation.privacy import publish_guard as guard
from foundation.index import trigram
from foundation.kernel import vsa


# ── fuzz corpora ──────────────────────────────────────────────────────────────
# Article 0.1 covers `.local` AND `*.local`. The guard flags `.local` as a path
# token (".local/x", "see .local", "a/.local/b") OR a filename suffix
# ("positions.local", "x.local"). Plus the PRIVATE:: marker. We assert zero leak.
# Clean strings keep genuine near-misses (.localish, locale-aware, mylocalfile,
# /usr/local) that the guard is RIGHT to pass.

def _private_corpus():
    leads = ["", " ", "  ", "\t", "\n", "see ", "src/", "a/b/", "./",
             '"', "'", "`", "ref -> ", "  see ", "data/", "vault/", "\n\t",
             "loaded ", "from ", "../", "x/y/z/", "open('", "cat ", "rm -rf "]
    tails = ["", "/positions.json", "/x", "/secret/key", "\n", "  ", "\t",
             "/.local/again", "/deep/nested/file", "/state", "/weights.npy",
             "/", "/a/b/c", "')", '"']
    out = []
    for lead in leads:
        for tail in tails:
            out.append(f"{lead}.local{tail}")
    # explicit PRIVATE:: markers in many shapes
    for body in ["secret", "PRIVATE::nested::deep", "key=hunter2", "", " trailing"]:
        out.append(f"PRIVATE::{body}")
        out.append(f"log line | PRIVATE::{body} | end")
    # whitespace-wrapped path tokens
    for core in [".local", ".local/state.json", "a/.local/b", "x/.local"]:
        out.append(f"   {core}   ")
        out.append(f"\t{core}\n")
    # JSON-embedded (the real attack surface: artifacts are dicts serialized to text)
    for core in [".local/positions.json", "a/b/.local/x"]:
        out.append(json.dumps({"id": "leak", "path": core}))
        out.append(json.dumps({"note": f"see {core} for details"}))
    # *.local filename suffixes — Article 0.1 covers *.local, not just .local/ paths
    for fn in ["positions.local", "x.local", "weights.local", "a/b/state.local",
               "foo.bar.local", "see positions.local please"]:
        out.append(fn)
    return out


def _clean_corpus():
    base = ["regime:inflationary", "edge:momentum", "risk:capped", "vol:high",
            "liquidity:tight", "a public note about strategy regimes",
            "the commons holds only de-identified trigrams",
            "mylocalfile", ".localish", "locale-aware",
            "PRIVATEish", "private notes", "PRIVATE_but_not_marker",
            "/usr/local/bin", "global config", "", "   ", "正常的公开文本",
            "kamuya açık metin", json.dumps({"id": "ok", "regime_factors": ["a:b"]})]
    # bulk the corpus up well past 200 with structured-but-clean variants
    out = list(base)
    for i in range(60):
        out.append(f"public concept #{i}: regime:inflationary edge:momentum")
        out.append(json.dumps({"id": f"r{i}", "factors": [f"f{i}:lvl{i}"],
                               "provenance": "public"}))
    return out


def test_fuzz_no_leaks():
    private = _private_corpus()
    assert len(private) >= 200, f"need >=200 fuzzed private inputs, got {len(private)}"
    leaks = [p for p in private if guard.is_publishable(p)]
    assert leaks == [], f"LEAK: {len(leaks)} tainted artifacts judged publishable, e.g. {leaks[:5]!r}"
    # and assert_publishable must RAISE on every one of them
    for p in private[:50]:
        try:
            guard.assert_publishable(p)
            raise AssertionError(f"assert_publishable failed to raise on {p!r}")
        except PermissionError:
            pass

    clean = _clean_corpus()
    blocked = [c for c in clean if not guard.is_publishable(c)]
    assert blocked == [], f"FALSE-POSITIVE: clean artifacts blocked, e.g. {blocked[:5]!r}"
    print(f"  fuzz: {len(private)} private all blocked, {len(clean)} clean all pass")


def test_publish_routes_through_guard():
    calls = []
    sink = lambda art: (calls.append(art), "SHIPPED")[1]

    # tainted artifact: sink must NEVER be called
    try:
        guard.publish(".local/positions.json", sink)
        raise AssertionError("publish must refuse a .local-tainted artifact")
    except PermissionError:
        pass
    assert calls == [], "sink was called on a tainted artifact — Article 0.2 breached"

    # PRIVATE:: marker too
    try:
        guard.publish("PRIVATE::secret weights", sink)
        raise AssertionError("publish must refuse a PRIVATE:: artifact")
    except PermissionError:
        pass
    assert calls == [], "sink was called on a PRIVATE:: artifact"

    # clean artifact: routes through and returns sink(art)
    out = guard.publish("regime:inflationary is public", sink)
    assert out == "SHIPPED" and calls == ["regime:inflationary is public"], (out, calls)
    print("  publish: tainted refused (sink untouched), clean shipped")


def test_trigram_contribution_gate():
    target = ["regime:inflationary", "edge:momentum", "risk:capped"]
    rec, tri = trigram.contribution(target, "cartographer:anon", [])
    assert rec["provenance"] == "public", rec
    assert rec["trigram"] == target and rec["contributor"] == "cartographer:anon"
    # the whole record must be publishable
    guard.assert_publishable(json.dumps(rec))

    # a .local-tainted concept must be blocked before the record can exist
    for tainted in [".local/secret", " .local", "a/.local/x"]:
        try:
            trigram.contribution([tainted, "edge:momentum", "risk:capped"], "x", [])
            raise AssertionError(f"contribution must block tainted concept {tainted!r}")
        except PermissionError:
            pass
    print("  contribution: clean -> provenance=public, .local concept refused")


def test_reward_split_conserves():
    for value in [0.0, 0.25, 1.0, 3.7, 42.0, 1000.0]:
        s = trigram.reward_split(value)
        assert abs(s["foundation"] - trigram.FOUNDATION_COST * value) < 1e-9, (value, s)
        assert abs(s["cartographer"] + s["foundation"] - value) < 1e-9, (value, s)
    # FOUNDATION_COST is the advertised 5%
    assert abs(trigram.FOUNDATION_COST - 0.05) < 1e-12
    print("  reward_split: foundation==5%, cartographer+foundation==value (6 values)")


def test_novelty_bounds():
    t = trigram.encode_trigram(["regime:inflationary", "edge:momentum", "risk:capped"])
    # a duplicate maps no new territory
    n_dup = trigram.novelty(t, [t])
    assert 0.0 <= n_dup <= 1.0 and n_dup < 0.2, n_dup
    # empty map -> maximal novelty
    assert trigram.novelty(t, []) == 1.0
    # a disjoint trigram maps fresh territory
    fresh = trigram.encode_trigram(["liquidity:tight", "vol:high", "credit:widening"])
    n_fresh = trigram.novelty(fresh, [t])
    assert 0.0 <= n_fresh <= 1.0 and n_fresh > 0.7, n_fresh
    print(f"  novelty: dup={n_dup:.3f} (<0.2), disjoint={n_fresh:.3f} (>0.7), all in [0,1]")


def test_encode_trigram_arity():
    # exactly three — every other arity is a ValueError
    trigram.encode_trigram(["a", "b", "c"])  # ok
    for bad in [[], ["a"], ["a", "b"], ["a", "b", "c", "d"], ["a"] * 9]:
        try:
            trigram.encode_trigram(bad)
            raise AssertionError(f"arity {len(bad)} must raise")
        except ValueError:
            pass
    print("  encode_trigram: exactly-3 law enforced (0,1,2,4,9 all rejected)")


def test_probe_recovers_targets():
    vocab = ["regime:inflationary", "edge:momentum", "risk:capped",
             "regime:risk_off", "edge:carry", "vol:high", "liquidity:tight",
             "credit:widening", "dollar:strong"]
    target = ["regime:inflationary", "edge:momentum", "risk:capped"]
    blend = vsa.bundle([trigram._concept_hv(c) for c in target])
    # add a 4th distractor LIGHTLY (small phase nudge toward it), must not displace a target
    distractor = trigram._concept_hv("vol:high")
    noisy = vsa.bundle([blend * 3.0, distractor])  # blend weighted 3:1 over distractor
    got = trigram.probe(noisy, vocab, k=3)
    assert set(got) == set(target), f"probe lost a target: got {got}, want {target}"
    # clean blend recovers exactly, deterministically
    assert set(trigram.probe(blend, vocab, k=3)) == set(target)
    print(f"  probe: recovered {target} from a noisy 3+distractor blend")


def run():
    test_fuzz_no_leaks()
    test_publish_routes_through_guard()
    test_trigram_contribution_gate()
    test_reward_split_conserves()
    test_novelty_bounds()
    test_encode_trigram_arity()
    test_probe_recovers_targets()
    print("test_privacy_props: OK")
    return True


if __name__ == "__main__":
    run()
