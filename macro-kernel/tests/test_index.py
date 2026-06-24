"""Local knowledge index: encode -> store -> retrieve, the capacity wall, the Article 0 gate."""
from foundation.index import store


def run():
    ix = store.Index()
    ix.add({"id": "r_infl", "kind": "regime", "title": "inflationary",
            "regime_factors": ["inflation:high", "rates:rising", "dollar:strong"],
            "provenance": "public", "contributor": "seed"})
    ix.add({"id": "r_riskoff", "kind": "regime", "title": "risk-off",
            "regime_factors": ["liquidity:tight", "vol:high", "credit:widening"],
            "provenance": "public", "contributor": "seed"})
    ix.add({"id": "r_riskon", "kind": "regime", "title": "risk-on",
            "regime_factors": ["liquidity:ample", "vol:low", "credit:tight"],
            "provenance": "public", "contributor": "seed"})

    # exact query recalls its regime at sim ~1.0
    top = ix.retrieve(["inflation:high", "rates:rising", "dollar:strong"], k=3)
    assert top[0][0] == "r_infl" and top[0][1] > 0.5, top
    # partial query (2 of 3 factors) still recalls it first
    assert ix.retrieve(["inflation:high", "rates:rising"], k=3)[0][0] == "r_infl"

    # capacity envelope is enforced
    try:
        store.encode_regime([f"f{i}:x" for i in range(store.FACTOR_CAP + 1)])
        raise AssertionError("FACTOR_CAP must be enforced")
    except ValueError:
        pass

    # Article 0: a .local-tainted entry cannot enter the commons
    try:
        ix.add({"id": "bad", "kind": "regime", "title": "x", "regime_factors": ["a:b"],
                "provenance": "public", "contributor": "x", "content": ".local/secret"})
        raise AssertionError("publish guard must block .local content")
    except PermissionError:
        pass
    print("test_index: OK")
    return True


if __name__ == "__main__":
    run()
