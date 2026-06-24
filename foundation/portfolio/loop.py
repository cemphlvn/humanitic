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
from foundation.portfolio import orthogonality, allocator, monitor, discovery
from foundation.eval import significance

BOOK_PATH = os.path.join(".local", "edges", "book.json")


def assemble(seeds_per_source=4, capacity=6, tau=0.5, cands=None):
    """Run the factory and return (book, weights, summary). Candidates come from `discovery` — many
    DIFFERENT finders (regime · pace · geodnet), so cross-source orthogonality is real, not cosmetic.
    n_trials = the total candidate count (network-wide multiple-testing in the Deflated Sharpe court)."""
    cands = cands if cands is not None else discovery.candidates(seeds_per_source=seeds_per_source)
    book = EdgeBook(capacity=capacity)
    n_trials = len(cands)
    streams = [(c, np.asarray(c["pnl"], float)) for c in cands]
    sharpes = [float(p.mean() / (p.std() + 1e-12)) for _, p in streams]
    sr_var = max(float(np.var(sharpes)), 1e-6)                  # empirical Sharpe dispersion across trials (proper DSR)
    log = []
    for c, pnl in streams:
        sharpe = float(pnl.mean() / (pnl.std() + 1e-12))
        dsr = significance.deflated_sharpe(sharpe, n_trials=n_trials, n_obs=len(pnl),
                                           sr_variance=sr_var)["deflated_sharpe"]
        if dsr < 0.95:                                              # HONESTY GATE (network-wide n_trials)
            log.append({"id": c["id"], "source": c["source"], "dsr": round(dsr, 3), "action": "fail-court"})
            continue
        e = make_edge(c["id"], c["source"], pnl, dsr, {"sharpe": round(sharpe, 4)})
        dec = orthogonality.admit(book, e, tau=tau)                 # ORTHOGONALITY (capacity-bounded)
        log.append({"id": c["id"], "source": c["source"], "dsr": round(dsr, 3),
                    "action": dec["action"], "novelty": dec["novelty"], "displaced": dec.get("displaced")})

    rev = monitor.review(book)                                      # DECAY / REDUNDANCY sweep
    retired = monitor.apply(book, rev)
    w = allocator.weights(book, method="risk_parity")               # ALLOCATE -> weight vector w_t
    summary = {"book_size": len(book), "capacity": capacity, "candidates": n_trials,
               "sources_admitted": sorted({book.get(i).source for i in book.ids()}),
               "edges": book.ids(), "weights": [round(float(x), 4) for x in w],
               "portfolio_sharpe": round(allocator.portfolio_sharpe(book, w), 4),
               "diversified_ir": round(allocator.diversified_ir(book), 4),
               "retired": list(retired), "log": log,
               "caveat": "synthetic discovery candidates (planted) — validates the machinery; live finders "
                         "(GEODNET / FrodoBots / market) feed discovery.SOURCES unchanged"}
    return book, w, summary


def build_book(seeds_per_source=4, capacity=6, tau=0.5, write_local=True):
    book, _, summary = assemble(seeds_per_source, capacity, tau)
    if write_local:
        book.save(BOOK_PATH)
        summary["book"] = BOOK_PATH
    return summary
