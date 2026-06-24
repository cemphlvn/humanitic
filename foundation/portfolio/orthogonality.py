"""
orthogonality — the admit/displace filter that keeps the BOOK genuinely broad. The fundamental law of
active management is IR = IC · √breadth, but breadth is only REAL when the bets are uncorrelated: ten
copies of the same edge are one edge, not ten. So this module measures a candidate's MARGINAL NOVELTY
(1 − its largest |correlation| to anything already in the book) and pulls the √breadth lever through it —
an edge earns its slot by being skillful AND orthogonal, scored as dsr · novelty.

The book is CAPACITY-BOUNDED: the VSA bundle-capacity wall C(D)=0.386·D bits caps how many orthogonal
edges the kernel can superpose before crosstalk swamps recall, so EdgeBook has a hard `capacity`. When the
book is full we do not just reject — we ask whether the candidate's marginal value beats the WEAKEST
incumbent's, where each incumbent is scored by its own dsr discounted by how redundant it has become
relative to the rest of the book. If the newcomer wins, it DISPLACES the weakest; otherwise it is turned
away. Skill alone never buys a seat — only skill that adds breadth the book does not already own.

Pure numpy, deterministic, no I/O. One concept per function: novelty, candidate value, incumbent value,
and the decision that mutates the book.
"""
import numpy as np


def _pearson(a, b):
    """|-free Pearson correlation of two 1D streams, aligned to the SHORTER (most recent overlap).
    0.0 when either side is degenerate (too short or zero-variance) — an undefined correlation is no
    evidence of redundancy, so it costs the candidate no novelty."""
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    T = min(len(a), len(b))
    if T < 2:
        return 0.0
    a, b = a[-T:], b[-T:]                                      # align on the most recent common bars
    sa, sb = a.std(), b.std()
    if sa == 0.0 or sb == 0.0:
        return 0.0
    r = float(np.corrcoef(a, b)[0, 1])
    return 0.0 if np.isnan(r) else r


def marginal_novelty(book, candidate_returns):
    """How much NEW direction the candidate adds: 1 − max(|corr| to any edge in the book). 1.0 for an
    empty book (the first edge is pure breadth); clamped to [0,1]. This is the √breadth lever — a
    candidate that merely echoes an incumbent scores near 0 and brings no breadth."""
    if len(book) == 0:
        return 1.0
    max_abs = max(abs(_pearson(candidate_returns, e.returns)) for e in book.edges)
    return float(np.clip(1.0 - max_abs, 0.0, 1.0))


def score(dsr, novelty):
    """Marginal value of an edge to the book: honesty-validated skill GATED by the breadth it adds.
    A brilliant edge that duplicates the book (novelty→0) is worth nothing; an orthogonal edge keeps
    its full skill."""
    return float(dsr) * float(novelty)


def incumbent_score(book, edge):
    """An incumbent's marginal value FROM THE BOOK'S POINT OF VIEW: its dsr discounted by how redundant
    it has become versus the REST of the book (novelty = 1 − max|corr| to the others). If it is the only
    edge, the novelty term is 1.0 — nothing else to be redundant with. This is what the weakest-link
    search ranks on, so displacement evicts the edge the book would miss least."""
    others = [e for e in book.edges if e.id != edge.id]
    if not others:
        return score(edge.dsr, 1.0)
    max_abs = max(abs(_pearson(edge.returns, o.returns)) for o in others)
    novelty = float(np.clip(1.0 - max_abs, 0.0, 1.0))
    return score(edge.dsr, novelty)


def admit(book, candidate, tau=0.5):
    """Decide the candidate's fate and MUTATE the book in place. tau is the redundancy ceiling: a
    candidate too correlated with the book (max|corr| > tau, i.e. novelty < 1 − tau) is rejected
    outright — it would not add breadth at any skill. Otherwise, if there is room it is admitted; if the
    book is full it must out-value the WEAKEST incumbent to displace it, else it is turned away.

    Returns a verdict dict: admitted, action ("admit"|"displace"|"reject"), displaced (id or None),
    novelty, score, and a one-line reason."""
    nov = marginal_novelty(book, candidate.returns)
    cand_score = score(candidate.dsr, nov)
    verdict = {"admitted": False, "action": "reject", "displaced": None,
               "novelty": round(nov, 4), "score": round(cand_score, 4), "reason": ""}

    # 1) Redundancy gate: too correlated with the book to add real breadth.
    if nov < (1.0 - tau):
        verdict["reason"] = "too correlated with book (novelty %.4f < %.4f)" % (nov, 1.0 - tau)
        return verdict

    # 2) Room on the shelf: skillful AND orthogonal enough, admit straight away.
    if len(book) < book.capacity:
        book.add(candidate)
        verdict.update(admitted=True, action="admit",
                       reason="orthogonal and book under capacity (%d/%d)" % (len(book), book.capacity))
        return verdict

    # 3) Book is full (at the bundle-capacity wall): displace only if it beats the weakest incumbent.
    weakest = min(book.edges, key=lambda e: incumbent_score(book, e))
    weakest_score = incumbent_score(book, weakest)
    if cand_score > weakest_score:
        book.remove(weakest.id)
        book.add(candidate)
        verdict.update(admitted=True, action="displace", displaced=weakest.id,
                       reason="beats weakest incumbent %s (%.4f > %.4f)"
                              % (weakest.id, cand_score, weakest_score))
        return verdict

    verdict["reason"] = ("book full, does not beat weakest incumbent %s (%.4f <= %.4f)"
                         % (weakest.id, cand_score, weakest_score))
    return verdict
