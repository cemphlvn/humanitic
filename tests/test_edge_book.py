"""EdgeBook spine: storage, the correlation matrix (the breadth currency), and .local round-trip."""
import numpy as np

from foundation.portfolio.edge_book import make_edge, EdgeBook


def run():
    rng = np.random.default_rng(0)
    base = rng.normal(0, 1, 200)
    b = EdgeBook(capacity=4)
    b.add(make_edge("e1", "atoms", base, 0.97))
    b.add(make_edge("e2", "pace", base + rng.normal(0, 0.1, 200), 0.96))      # correlated with e1
    b.add(make_edge("e3", "geodnet", rng.normal(0, 1, 200), 0.95))            # independent

    assert len(b) == 3 and set(b.ids()) == {"e1", "e2", "e3"}
    C = b.correlation()
    assert C.shape == (3, 3)
    assert C[0, 1] > 0.8 and abs(C[0, 2]) < 0.3                               # e1~e2 high; e1,e3 low

    b.remove("e2")
    assert b.ids() == ["e1", "e3"]

    b2 = EdgeBook.from_dict(b.to_dict())                                       # round-trip
    assert b2.ids() == b.ids() and b2.capacity == b.capacity
    assert np.allclose(b2.get("e1").returns, b.get("e1").returns)

    print("test_edge_book: OK (book + correlation matrix + round-trip)")
    return True


if __name__ == "__main__":
    run()
