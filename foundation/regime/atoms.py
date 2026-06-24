"""
atoms — mine ATOMS of robot-signal ↔ market-correspondent, carrying NON-ABELIAN (order-dependent)
structure.

An ATOM is the smallest cross-domain correspondence unit: an ordered ROBOT signal sequence bound to its
ordered MARKET correspondent. Plain VSA `bind` is ABELIAN (commutative — the lineage's measured wall),
so order is encoded with `permute` (positional roll): `[reach, grasp]` binds differently from
`[grasp, reach]`. That is how the abelian substrate carries the NON-ABELIAN structure that action
sequences and operator pipelines demand — order matters.

Atoms are MINED locally and stored in `.local` (private IP, the runtime writes there); prediction
(robot signal → market correspondent) is order-sensitive retrieval over the mined atoms. Open data goes
in; private atoms stay home; only de-identified correspondences leave.
"""
from foundation.kernel import vsa
from foundation.index import store


def _hv(factor):
    return store.encode_regime([factor]) if ":" in factor else store.symbol(factor)


def encode_sequence(factors):
    """Encode an ORDERED sequence with `permute` (non-abelian): position i bound by a roll of i.
    [a, b] != [b, a]. This is the abelian substrate carrying order."""
    return vsa.bundle([vsa.permute(_hv(f), i) for i, f in enumerate(factors)])


def mine_atom(robot_seq, market_seq):
    """An atom = bind(ordered robot signal, ordered market correspondent) — the cross-domain unit."""
    r, m = encode_sequence(robot_seq), encode_sequence(market_seq)
    return {"robot": list(robot_seq), "market": list(market_seq),
            "_r": r, "_m": m, "_vec": vsa.bind(r, m)}


def predict_market(atoms, robot_seq, k=1):
    """Given a robot signal sequence, retrieve the market correspondent — order-sensitive (non-abelian)."""
    r = encode_sequence(robot_seq)
    scored = sorted(((a, vsa.similarity(a["_r"], r)) for a in atoms), key=lambda x: -x[1])
    return [(a["market"], s) for a, s in scored[:k]]


class AtomStore:
    """Mine atoms in memory; the runtime loads/saves them from .local/atoms/ (private). This code never
    creates .local on its own — `load_local` reads what your runtime mined there."""
    def __init__(self):
        self.atoms = []

    def mine(self, robot_seq, market_seq):
        self.atoms.append(mine_atom(robot_seq, market_seq))
        return self.atoms[-1]

    def load_local(self, root=".local/atoms"):
        import os
        import json
        import glob
        for p in sorted(glob.glob(os.path.join(root, "*.json"))):
            a = json.load(open(p))
            self.mine(a["robot"], a["market"])
        return len(self.atoms)

    def predict_market(self, robot_seq, k=1):
        return predict_market(self.atoms, robot_seq, k)
