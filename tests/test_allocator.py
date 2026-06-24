"""Allocator: equal-risk weighting turns breadth into compounding. 3 INDEPENDENT edges of similar
skill -> risk_parity weights are ~equal and gross-capped; the book's diversified IR ~ √3 x a single
edge's Sharpe; and the combined Sharpe BEATS the best single edge — diversification is the free lunch."""
import numpy as np

from foundation.portfolio.edge_book import make_edge, EdgeBook
from foundation.portfolio import allocator as A


def run():
    rng = np.random.default_rng(0)
    T, mu, sigma = 4000, 0.05, 1.0                            # similar positive mean, similar vol

    # 3 INDEPENDENT edges (separate rng draws -> ~uncorrelated)
    r1 = rng.normal(mu, sigma, T)
    r2 = rng.normal(mu, sigma, T)
    r3 = rng.normal(mu, sigma, T)
    book = EdgeBook(capacity=4)
    book.add(make_edge("e1", "atoms", r1, 0.9))
    book.add(make_edge("e2", "pace", r2, 0.9))
    book.add(make_edge("e3", "geodnet", r3, 0.9))

    # confirm the edges really are ~uncorrelated (breadth is only real if so)
    C = book.correlation()
    assert abs(C[0, 1]) < 0.1 and abs(C[0, 2]) < 0.1 and abs(C[1, 2]) < 0.1

    # risk_parity: similar vol -> ~equal weights, and Σ|w| == max_gross
    w = A.weights(book, method="risk_parity", max_gross=1.0)
    assert w.shape == (3,)
    assert abs(np.sum(np.abs(w)) - 1.0) < 1e-9                # gross cap exactly enforced
    assert np.allclose(w, 1.0 / 3.0, atol=0.02)              # equal-risk -> ~equal weight (similar vol)

    # max_gross scales the gross exposure linearly
    w2 = A.weights(book, method="risk_parity", max_gross=2.0)
    assert abs(np.sum(np.abs(w2)) - 2.0) < 1e-9

    # diversified IR ~ √3 x a single edge's sharpe (the IR = IC·√breadth multiplier)
    def edge_sharpe(r):
        return float(np.mean(r) / np.std(r))
    singles = [edge_sharpe(r1), edge_sharpe(r2), edge_sharpe(r3)]
    s_avg = np.mean(singles)
    dir_ = A.diversified_ir(book)
    assert abs(dir_ - np.sqrt(3.0) * s_avg) / (np.sqrt(3.0) * s_avg) < 0.05    # within 5%
    assert np.isclose(dir_, np.sqrt(sum(s * s for s in singles)))             # exact identity

    # the payoff: combined Sharpe EXCEEDS the best single edge — diversification works
    sp = A.portfolio_sharpe(book, w)
    assert sp > max(singles)
    assert sp > 1.3 * max(singles)                            # ~√3 lift over a single edge

    # fractional_kelly: positive means -> all-positive weights, gross-capped
    wk = A.weights(book, method="fractional_kelly", kelly_fraction=0.5, max_gross=1.0)
    assert abs(np.sum(np.abs(wk)) - 1.0) < 1e-9 and np.all(wk > 0)

    # guards: empty book -> empty array, zero portfolio sharpe, zero IR
    empty = EdgeBook()
    assert A.weights(empty).shape == (0,)
    assert A.portfolio_sharpe(empty, np.zeros(0)) == 0.0
    assert A.diversified_ir(empty) == 0.0

    # guard: a zero-vol (constant) edge gets weight 0, never poisons the book
    zb = EdgeBook()
    zb.add(make_edge("flat", "const", np.full(T, 0.3), 0.5))
    zb.add(make_edge("live", "real", r1, 0.9))
    wz = A.weights(zb, method="risk_parity")
    assert wz[0] == 0.0 and wz[1] > 0.0

    print("test_allocator: OK (3 indep edges -> ~equal risk_parity weights, gross-capped; "
          "diversified_ir ~ √3 x single sharpe; portfolio sharpe BEATS the best single edge)")
    return True


if __name__ == "__main__":
    run()
