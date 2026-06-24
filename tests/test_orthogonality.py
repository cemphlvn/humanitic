"""Orthogonality filter: breadth is real only if uncorrelated (IR=IC·√breadth pulled through novelty).
A near-duplicate of an incumbent adds no breadth and is rejected; an orthogonal edge is admitted. When the
book is at the bundle-capacity wall, a higher-value orthogonal candidate DISPLACES the weakest incumbent
and a low-value one is turned away — skill alone never buys a seat."""
import numpy as np

from foundation.portfolio.edge_book import make_edge, EdgeBook
from foundation.portfolio import orthogonality as O


def run():
    rng = np.random.default_rng(0)

    # Empty book -> the first edge is pure breadth.
    empty = EdgeBook(capacity=4)
    assert O.marginal_novelty(empty, rng.normal(0, 1, 200)) == 1.0

    base = rng.normal(0, 1, 200)
    b = EdgeBook(capacity=3)
    b.add(make_edge("e1", "atoms", base, 0.90))

    # A near-copy of e1 is highly correlated -> low novelty -> REJECTED (no breadth added).
    dup = base + rng.normal(0, 0.02, 200)
    nov_dup = O.marginal_novelty(b, dup)
    assert nov_dup < 0.5
    v = O.admit(b, make_edge("dup", "atoms", dup, 0.99), tau=0.5)
    assert not v["admitted"] and v["action"] == "reject"
    assert b.ids() == ["e1"]                                   # book untouched by a rejection

    # An independent stream is orthogonal -> high novelty -> ADMITTED (room on the shelf).
    indep = rng.normal(0, 1, 200)
    nov_indep = O.marginal_novelty(b, indep)
    assert nov_indep > 0.7
    v = O.admit(b, make_edge("e2", "pace", indep, 0.80), tau=0.5)
    assert v["admitted"] and v["action"] == "admit" and v["displaced"] is None
    assert set(b.ids()) == {"e1", "e2"}

    # score = dsr * novelty (skill gated by breadth).
    assert abs(O.score(0.8, 0.5) - 0.4) < 1e-9

    # Fill the book to capacity with mutually orthogonal edges of differing skill.
    full = EdgeBook(capacity=3)
    s1, s2, s3 = rng.normal(0, 1, 200), rng.normal(0, 1, 200), rng.normal(0, 1, 200)
    full.add(make_edge("w", "src1", s1, 0.30))                 # the weakest incumbent (low dsr, orthogonal)
    full.add(make_edge("m", "src2", s2, 0.70))
    full.add(make_edge("s", "src3", s3, 0.90))
    assert len(full) == full.capacity

    # Incumbent scoring: all three are mutually independent, so each score ~= its own dsr -> "w" weakest.
    weakest = min(full.edges, key=lambda e: O.incumbent_score(full, e))
    assert weakest.id == "w"

    # A HIGH-score orthogonal candidate displaces the weakest incumbent "w".
    strong = rng.normal(0, 1, 200)
    nov_strong = O.marginal_novelty(full, strong)
    assert O.score(0.85, nov_strong) > O.incumbent_score(full, weakest)
    v = O.admit(full, make_edge("hot", "src4", strong, 0.85), tau=0.5)
    assert v["admitted"] and v["action"] == "displace" and v["displaced"] == "w"
    assert set(full.ids()) == {"m", "s", "hot"}                # "w" evicted, "hot" seated
    assert len(full) == full.capacity                          # capacity wall respected

    # A LOW-score orthogonal candidate cannot out-value the (new) weakest incumbent -> REJECTED.
    weak_cand = rng.normal(0, 1, 200)
    before = set(full.ids())
    v = O.admit(full, make_edge("cold", "src5", weak_cand, 0.05), tau=0.5)
    assert not v["admitted"] and v["action"] == "reject" and v["displaced"] is None
    assert set(full.ids()) == before                           # full book untouched

    print("test_orthogonality: OK (empty novelty=1; correlated rejected; orthogonal admitted; "
          "high-score displaces weakest; low-score rejected at capacity wall)")
    return True


if __name__ == "__main__":
    run()
