"""
allocator — combine the orthogonal edges in an EdgeBook into ONE weight vector: turn breadth into
compounding without letting a single edge threaten survival. The book is the supply of uncorrelated
alpha; the allocator is how we spend it.

WHY equal-RISK (inverse-vol), not equal-dollar: for genuinely uncorrelated edges the portfolio variance
is the sum of the per-edge variances, so weighting each edge to contribute the SAME risk makes the
portfolio Sharpe add up — Sharpe_p ≈ √(Σ Sharpe_i²). That is the IR = IC·√breadth law realized: N
independent edges of equal skill give √N times the single-edge Sharpe (see diversified_ir). Breadth is
the only free lunch, and only inverse-vol weighting collects it cleanly.

WHY fractional Kelly, not full: full Kelly maximizes log-growth but rides the survival floor — a single
estimation error or a fat tail breaches it. We size at a FRACTION (default ½) of the Kelly weight and
CAP gross exposure (sum of |weights| ≤ max_gross), so no one edge — and no leverage — can drive the
book below the floor. Growth is sacrificed at the margin to guarantee we stay in the game to compound.

One concept per function: weights (how to spend breadth), portfolio_returns (the combined stream),
portfolio_sharpe (its realized skill), diversified_ir (the breadth multiplier the book is owed).
"""
import numpy as np


def weights(book, method="risk_parity", kelly_fraction=0.5, max_gross=1.0):
    """Allocation weights over the book's edges, shape (n,). 'risk_parity' = inverse-vol (equal risk
    contribution); 'fractional_kelly' = f·mean/var per edge. Both rescaled so Σ|w| == max_gross. Zero-vol
    edges get weight 0; an empty book returns an empty array."""
    n = len(book)
    if n == 0:
        return np.zeros(0)
    edges = book.edges
    eps = 1e-12                                                           # vol below this is "no signal"
    if method == "risk_parity":
        vol = np.array([np.std(e.returns) if len(e.returns) else 0.0 for e in edges])
        live = vol > eps
        raw = np.where(live, 1.0 / np.where(live, vol, 1.0), 0.0)         # 1/std, zero-vol -> 0
    elif method == "fractional_kelly":
        mean = np.array([np.mean(e.returns) if len(e.returns) else 0.0 for e in edges])
        var = np.array([np.var(e.returns) if len(e.returns) else 0.0 for e in edges])
        live = var > eps
        raw = np.where(live, kelly_fraction * mean / np.where(live, var, 1.0), 0.0)
    else:
        raise ValueError(f"unknown method: {method!r}")
    gross = np.sum(np.abs(raw))
    if gross == 0:                                                        # all edges degenerate
        return np.zeros(n)
    return raw * (max_gross / gross)                                      # scale so Σ|w| == max_gross


def portfolio_returns(book, w):
    """The combined per-bar stream (T,): weighted sum of the aligned edge returns. Uses returns_matrix()
    so every edge is truncated to the shortest (most recent T bars). Empty book -> zeros."""
    M = book.returns_matrix()                                             # (n, T) aligned
    if M.shape[0] == 0 or M.shape[1] == 0:
        return np.zeros(M.shape[1] if M.ndim == 2 else 0)
    return np.asarray(w, float) @ M                                       # (T,)


def portfolio_sharpe(book, w):
    """Realized skill of the combined book: mean/std of its return stream (per-bar, unannualized). 0.0
    when the stream is empty or has no dispersion."""
    r = portfolio_returns(book, w)
    if len(r) == 0:
        return 0.0
    s = np.std(r)
    return float(np.mean(r) / s) if s > 0 else 0.0


def diversified_ir(book):
    """The breadth multiplier the book is OWED: √(Σ Sharpe_i²) over each edge's own mean/std. For an
    (assumed ~uncorrelated) book this is the portfolio Sharpe an equal-risk allocation should approach —
    the IR = IC·√breadth ceiling. 0.0 for an empty book."""
    if len(book) == 0:
        return 0.0
    sq = 0.0
    for e in book.edges:
        if len(e.returns) == 0:
            continue
        s = np.std(e.returns)
        if s > 0:
            sq += (np.mean(e.returns) / s) ** 2
    return float(np.sqrt(sq))
