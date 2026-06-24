"""The seeded knowledge index (real workflow data): loads under Article 0 and recalls itself."""
import os
import glob
from foundation.index import store


def run():
    root = store.COMMONS
    if not glob.glob(os.path.join(root, "**", "*.json"), recursive=True):
        print("test_commons: SKIP (no seeded commons yet)")
        return True

    ix = store.Index()
    n = ix.load_commons()                          # each entry must pass the Article 0 gate to load
    assert n >= 8, f"expected >=8 seeded entries, got {n}"

    for e in ix.entries:                           # self-recall: each entry is its own nearest regime
        top = ix.retrieve(e["regime_factors"], k=1)
        assert top[0][0] == e["id"], f"{e['id']} did not self-recall ({top})"

    for e in ix.entries:                           # one level per feature in a single regime vector
        feats = [f.split(":")[0] for f in e["regime_factors"]]
        assert len(feats) == len(set(feats)), f"{e['id']} repeats a feature: {feats}"

    print(f"test_commons: OK ({n} entries, self-recall {n}/{n})")
    return True


if __name__ == "__main__":
    run()
