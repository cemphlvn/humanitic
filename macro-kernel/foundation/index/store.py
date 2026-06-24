"""
The local knowledge index — the executable indexing pipeline.

    capture -> encode (FHRR regime vector) -> store -> retrieve (nearest-regime)

Public commons only; every store/export routes through Article 0's publish_guard.
Capacity-envelope discipline (the LABNOTES wall): store FACTORS not items;
FACTOR_CAP bounds how many bound pairs go into one `bundle` before crosstalk.
"""
import os
import json
import glob
import hashlib
import numpy as np
from foundation.kernel import vsa
from foundation.privacy import publish_guard

D = 4096
FACTOR_CAP = 16
COMMONS = os.path.join(os.path.dirname(__file__), "commons")


def _seed(name):                                   # stable across processes (NOT builtin hash)
    return int(hashlib.sha256(name.encode()).hexdigest(), 16) % (2 ** 32)

def symbol(name):                                  # deterministic hypervector for a token
    return vsa.rand_hv(D, np.random.default_rng(_seed(name)))


def encode_regime(factors):
    """['feature:level', ...] -> one FHRR regime vector. bind each pair, then bundle."""
    if len(factors) > FACTOR_CAP:
        raise ValueError(f"{len(factors)} factors exceeds FACTOR_CAP {FACTOR_CAP} "
                         f"(capacity envelope: store factors not items)")
    pairs = []
    for f in factors:
        feat, _, lvl = f.partition(":")
        lvl = lvl or feat
        pairs.append(vsa.bind(symbol(feat.strip()), symbol(lvl.strip())))
    return vsa.bundle(pairs)


class Index:
    def __init__(self):
        self.entries = []

    def add(self, entry):
        publish_guard.assert_publishable(json.dumps(entry))   # Article 0 gate at the door
        e = dict(entry)
        e["_vec"] = encode_regime(e["regime_factors"])
        self.entries.append(e)
        return e["id"]

    def load_commons(self, root=COMMONS):
        for p in sorted(glob.glob(os.path.join(root, "**", "*.json"), recursive=True)):
            with open(p) as f:
                self.add(json.load(f))
        return len(self.entries)

    def retrieve(self, query_factors, k=3):
        """Nearest-regime recall: encode the query, score every entry, return top-k."""
        q = encode_regime(query_factors)
        book = np.stack([e["_vec"] for e in self.entries])
        sims = np.real(book @ np.conj(q)) / q.shape[0]
        order = np.argsort(-sims)[:k]
        return [(self.entries[int(i)]["id"], float(sims[int(i)])) for i in order]

    def export_commons(self):
        """Publish-guarded export of public entries (drops the encoded vector)."""
        out = []
        for e in self.entries:
            pub = {x: e[x] for x in e if not x.startswith("_")}
            publish_guard.assert_publishable(json.dumps(pub))
            out.append(pub)
        return out
