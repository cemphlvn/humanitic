"""The portfolio decay court: alpha is perishable, so a CAPACITY-BOUNDED book must turn over. We retire an
edge when its RECENT-window deflated Sharpe falls below the floor (decayed) or when it is highly correlated
with a STRONGER edge (redundant — keep the better half of the pair), freeing slots for new alpha."""
import numpy as np

from foundation.portfolio.edge_book import EdgeBook, make_edge
from foundation.portfolio import monitor as M


def run():
    rng = np.random.default_rng(0)

    # (1) FRESH STRONG edge: recent window has a clear positive mean -> good sharpe -> high rolling DSR.
    fresh = rng.normal(0.15, 1.0, 600)
    # (2) DECAYED edge: strong long ago, but its recent `window` is ~pure noise (mean ~ 0) -> low DSR.
    decayed = np.concatenate([rng.normal(0.20, 1.0, 350), rng.normal(0.0, 1.0, 250)])
    # (3) REDUNDANT pair: two near-identical (highly correlated) live edges, both with strong recent
    #     windows; the LOWER stored-dsr copy must be retired as redundant, the higher-dsr leader kept.
    base = rng.normal(0.18, 1.0, 600)
    follower = base + rng.normal(0.0, 0.05, 600)               # corr ~ 1 with base

    book = EdgeBook(capacity=16)
    book.add(make_edge("fresh", "srcA", fresh, dsr=0.97, meta={}))
    book.add(make_edge("decayed", "srcB", decayed, dsr=0.96, meta={}))
    book.add(make_edge("leader", "srcC", base, dsr=0.95, meta={}))      # higher dsr -> kept
    book.add(make_edge("follower", "srcD", follower, dsr=0.80, meta={}))  # lower dsr -> redundant

    res = M.review(book, min_dsr=0.5, max_corr=0.8, window=250)
    reasons = {r["id"]: r["reason"] for r in res["retire"]}

    # (1) the fresh strong edge survives both gates
    assert "fresh" in res["keep"], res
    assert M.rolling_dsr(fresh) > 0.5

    # (2) the decayed edge is retired specifically for decay (recent window is noise)
    assert reasons.get("decayed") == "decayed", res
    assert M.rolling_dsr(decayed) < 0.5

    # (3) of the correlated pair, the weaker (lower stored dsr) is retired as redundant; the leader stays
    assert reasons.get("follower") == "redundant", res
    assert "leader" in res["keep"], res
    assert abs(book.correlation()[2, 3]) > 0.8                 # the pair really is correlated

    # the decay check wins ties: a retired edge appears exactly once, never double-labelled
    assert len([r["id"] for r in res["retire"]]) == len(set(r["id"] for r in res["retire"]))

    # (4) apply shrinks the book in place to exactly the kept ids
    removed = M.apply(book, res)
    assert set(removed) == {"decayed", "follower"}
    assert book.ids() == res["keep"] == ["fresh", "leader"]
    assert len(book) == 2

    print("test_edge_monitor: OK (fresh kept; decayed retired; weaker-of-correlated-pair redundant; apply shrinks book)")
    return True


if __name__ == "__main__":
    run()
