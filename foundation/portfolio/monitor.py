"""
monitor — the DECAY court for the portfolio-of-edges book. Alpha is perishable: an edge that was real
last year leaks as the world arbitrages it away, and a book that only ever ADDS edges silently fills with
ghosts. The book is CAPACITY-BOUNDED (C(D)=0.386·D bits — see edge_book.py / orthogonality.py), so every
slot a dead edge occupies is a slot a live one cannot have. This module turns the book over by retiring
edges on two honest grounds, freeing capacity for new alpha:

  • DECAYED  — judge the edge on its RECENT window only. Its full-history Deflated Sharpe lives in the
               book, but skill is measured here-and-now: if the rolling deflated Sharpe of the last
               `window` bars has fallen below the floor, the edge no longer earns its slot.
  • REDUNDANT — breadth is real only between UNCORRELATED edges. When two edges are highly correlated
               they are one bet held twice, so we keep the STRONGER (higher stored dsr) and retire the
               weaker — the correlated pair collapses to its better half.

Pure storage-free scoring: numpy only, deterministic, no network, no file writes. `review` produces the
verdict (a plan), `apply` enacts it on the book in place — never both at once.
"""
import numpy as np

from foundation.eval import significance


def rolling_dsr(returns, window=250, n_trials=1, sr_variance=0.01):
    """Deflated Sharpe of the edge's MOST RECENT window — skill measured here-and-now, not over all history.
    Take the last `window` bars (or all if shorter), form sharpe = mean/std, and deflate it via the
    multiple-testing court. Degenerate windows (too few bars or zero dispersion) score 0.0 — no skill."""
    r = np.asarray(returns, float)
    w = r[-window:] if len(r) > window else r
    n = len(w)
    if n < 2:
        return 0.0
    sd = w.std()
    if sd < 1e-12:
        return 0.0
    sharpe = float(w.mean() / sd)
    return float(significance.deflated_sharpe(sharpe, n_trials=n_trials, n_obs=n,
                                              sr_variance=sr_variance)["deflated_sharpe"])


def review(book, min_dsr=0.5, max_corr=0.8, window=250):
    """Build the retirement plan WITHOUT touching the book. An edge is retired if it has DECAYED (its
    rolling deflated Sharpe over the recent `window` < min_dsr) OR is REDUNDANT (|corr| > max_corr with
    another edge whose stored dsr is strictly higher — keep the stronger of the pair). Decay is checked
    first, so a decayed edge is never relabelled redundant. Each id is retired at most once."""
    ids = book.ids()
    rdsr = {eid: rolling_dsr(book.get(eid).returns, window=window) for eid in ids}
    corr = book.correlation()                                  # (n, n) Pearson, aligned to ids order
    retire, retired = [], set()

    for i, eid in enumerate(ids):
        if rdsr[eid] < min_dsr:                                # (a) DECAYED — recent skill below the floor
            retire.append({"id": eid, "reason": "decayed", "rolling_dsr": rdsr[eid]})
            retired.add(eid)
            continue
        my_dsr = book.get(eid).dsr
        for j, other in enumerate(ids):                        # (b) REDUNDANT — correlated with a stronger edge
            if j == i:
                continue
            if abs(corr[i, j]) > max_corr and book.get(other).dsr > my_dsr:
                retire.append({"id": eid, "reason": "redundant", "rolling_dsr": rdsr[eid]})
                retired.add(eid)
                break

    keep = [eid for eid in ids if eid not in retired]
    return {"retire": retire, "keep": keep}


def apply(book, review_result):
    """Enact a `review` plan: remove every retired id from the book in place; return the removed ids."""
    removed = [r["id"] for r in review_result["retire"]]
    for eid in removed:
        book.remove(eid)
    return removed
