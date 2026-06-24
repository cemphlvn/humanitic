"""The portfolio-of-edges loop: discover -> court -> orthogonality -> monitor -> allocate -> book + w_t."""
from foundation.portfolio import loop


def run():
    out = loop.build_book(n_candidates=10, capacity=6, write_local=False)

    # multiple orthogonal edges admitted (breadth), bounded by capacity
    assert 2 <= out["book_size"] <= 6
    assert len(out["weights"]) == out["book_size"]
    assert abs(sum(abs(x) for x in out["weights"]) - 1.0) < 1e-6        # risk-parity gross-normalized
    assert out["diversified_ir"] > 0 and out["portfolio_sharpe"] > 0

    # the diversified IR reflects breadth: more than a single edge's skill
    assert out["diversified_ir"] >= out["portfolio_sharpe"] * 0.5

    print("test_portfolio_loop: OK (book=%d edges; div_ir=%.2f; port_sharpe=%.2f; retired=%d)"
          % (out["book_size"], out["diversified_ir"], out["portfolio_sharpe"], len(out["retired"])))
    return True


if __name__ == "__main__":
    run()
