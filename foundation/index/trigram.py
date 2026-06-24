"""
Conceptual trigrams — how a PRIVATE strategy contributes to the PUBLIC commons without breaking
Article 0.

A strategy lives, in full, in `.local` (Article 0: never published). What it contributes is a
TRIGRAM: an ordered triple of concepts drawn from a PUBLIC vocabulary, encoded as one FHRR
hypervector (three "lines", I-Ching-resonant). The trigram is a de-identified, lossy,
NON-INVERTIBLE conceptual coordinate — a NEW public object, not the strategy. You cannot
reconstruct positions or logic from three bound concepts. So the trigram is publishable; the
strategy is not.

The PROBE is the one sanctioned crossing: semantic space (any language) -> public conceptual
topology. TR/EN/ZH expressions of the same idea land in the same region — that is what makes the
topology UNIFYING.

Reward: contributing/mining a trigram rewards the CULTURAL CARTOGRAPHER (the contributor who charts
conceptual territory) in proportion to NOVELTY (new territory mapped), minus a 5% FOUNDATION COST
that funds the open-core commons. The reward is privacy-BOUNDED by construction: novelty is measured
in the public topology, so a more-revealing trigram is never worth more than a properly-abstracted
one. Article 0 is the floor; the economy may never erode it. (Whether a probe is non-invertible
ENOUGH is an EDR — see foundation/nodes/conceptual-trigrams.md.)
"""
import json
import numpy as np
from foundation.kernel import vsa
from foundation.index import store
from foundation.privacy import publish_guard

FOUNDATION_COST = 0.05                                   # 5% to the foundation; 95% to the cartographer
_POS = [store.symbol(f"pos:{i}") for i in (1, 2, 3)]      # the three lines of the trigram


def _concept_hv(c):
    """A public concept token 'feature:level' (or a bare concept) -> hypervector."""
    feat, _, lvl = c.partition(":")
    return vsa.bind(store.symbol(feat.strip()), store.symbol((lvl or feat).strip()))


def encode_trigram(concepts):
    """Exactly three public concepts -> one ordered FHRR trigram (positional bind, then bundle)."""
    if len(concepts) != 3:
        raise ValueError("a trigram is exactly three concepts")
    return vsa.bundle([vsa.bind(_POS[i], _concept_hv(c)) for i, c in enumerate(concepts)])


def probe(semantic_hv, vocab_names, k=3):
    """The sanctioned crossing: project a fuzzy semantic vector onto the PUBLIC vocabulary,
    emitting k discrete concepts. Lossy and non-invertible by design."""
    book = np.stack([_concept_hv(c) for c in vocab_names])
    sims = np.real(book @ np.conj(semantic_hv)) / semantic_hv.shape[0]
    return [vocab_names[int(i)] for i in np.argsort(-sims)[:k]]


def novelty(tri_hv, existing):
    """New conceptual territory this trigram maps: 1 - max similarity to the known map."""
    if not existing:
        return 1.0
    sims = np.real(np.stack(existing) @ np.conj(tri_hv)) / tri_hv.shape[0]
    return float(np.clip(1.0 - np.max(sims), 0.0, 1.0))


def reward_split(value):
    """Cartographer 95% / foundation 5% — the economy's only built-in cost."""
    foundation = FOUNDATION_COST * value
    return {"cartographer": value - foundation, "foundation": foundation}


def contribution(concepts, contributor, existing_trigrams):
    """The PUBLIC contribution record for a trigram mined from a (.local) strategy. It carries only
    public concepts and is checked against Article 0 BEFORE it can exist."""
    tri = encode_trigram(concepts)
    nov = novelty(tri, existing_trigrams)
    rec = {"trigram": list(concepts), "contributor": contributor,
           "novelty": round(nov, 4), "reward": reward_split(nov), "provenance": "public"}
    publish_guard.assert_publishable(json.dumps(rec))    # no .local may ride along
    return rec, tri
