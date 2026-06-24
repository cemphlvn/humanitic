"""
loop — the portfolio-of-edges factory. Closes the architecture from the one-sentence target:

    discover candidates (novel sources)
      -> VALIDATE in the court (Deflated Sharpe, n_trials = all candidates) ...... honesty gate
      -> ADMIT only the orthogonal ones (capacity-bounded displacement) ........... breadth currency
      -> RETIRE decayed / redundant edges (monitor) ............................... keep the book alive
      -> ALLOCATE across the book (risk-parity) -> the weight vector w_t .......... breadth -> compounding

Output: the book + w_t + the diversified IR. Honesty-gated, survival-floored (paper-only downstream).
Persists the book to .local/edges/ (private). Candidates here are synthetic regime edges (planted, flagged)
— a live discovery feed (atoms / pace / DePIN) drops into `candidate()` unchanged.
"""
import os

import numpy as np

from foundation.portfolio.edge_book import make_edge, EdgeBook
from foundation.portfolio import orthogonality, allocator, monitor
from foundation.regime import unsupervised
from foundation.eval import significance

BOOK_PATH = os.path.join(".local", "edges", "book.json")


def candidate(seed, n=1500):
    """Discovery: one edge candidate from the unsupervised regime trader (a distinct 'source')."""
    feat, fwd, _ = unsupervised.synth_regime_world(n=n, seed=seed)
    pos, r, _ = unsupervised.dynamic_trade(feat, fwd, seed=seed)
    pnl = np.clip(pos, -1.0, 1.0) * r
    sharpe = float(pnl.mean() / (pnl.std() + 1e-12))
    return pnl, sharpe


def build_book(n_candidates=10, capacity=6, tau=0.5, seed0=1, write_local=True):
    book = EdgeBook(capacity=capacity)
    log = []
    for i in range(n_candidates):
        pnl, sharpe = candidate(seed0 + i)
        dsr = significance.deflated_sharpe(sharpe, n_trials=n_candidates, n_obs=len(pnl),
                                           sr_variance=0.01)["deflated_sharpe"]
        if dsr < 0.95:                                              # HONESTY GATE
            log.append({"cand": i, "dsr": round(dsr, 3), "action": "fail-court"})
            continue
        e = make_edge("edge-%d" % i, "regime/seed-%d" % (seed0 + i), pnl, dsr, {"sharpe": round(sharpe, 4)})
        dec = orthogonality.admit(book, e, tau=tau)                 # ORTHOGONALITY (capacity-bounded)
        log.append({"cand": i, "dsr": round(dsr, 3), "action": dec["action"],
                    "novelty": dec["novelty"], "displaced": dec.get("displaced")})

    rev = monitor.review(book)                                      # DECAY / REDUNDANCY sweep
    retired = monitor.apply(book, rev)
    w = allocator.weights(book, method="risk_parity")               # ALLOCATE -> weight vector
    out = {"book_size": len(book), "capacity": capacity, "candidates": n_candidates,
           "edges": book.ids(), "weights": [round(float(x), 4) for x in w],
           "portfolio_sharpe": round(allocator.portfolio_sharpe(book, w), 4),
           "diversified_ir": round(allocator.diversified_ir(book), 4),
           "retired": list(retired), "log": log,
           "caveat": "synthetic regime candidates (planted) — validates the portfolio machinery; "
                     "live discovery edges replace candidate() unchanged"}
    if write_local:
        book.save(BOOK_PATH)
        out["book"] = BOOK_PATH
    return out
