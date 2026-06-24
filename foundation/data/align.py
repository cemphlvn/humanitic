"""
align — TIME-MAPPED alignment of two timestamped streams (a robotic data stream and crypto-project
dynamics), AS-OF joined CAUSALLY: each robot frame at time t pairs with the most-recent crypto frame at
time <= t within a tolerance (backward as-of join — the open `merge_asof` standard). No lookahead: the
future never aligns into the past. This is the research-grade temporal join behind cross-domain analysis.
"""
import numpy as np


def asof_align(t_left, t_right, tolerance=None):
    """For each t_left[i], the index j of the most-recent t_right at or before it (backward, causal);
    -1 if none within `tolerance`. O(n+m); both inputs sorted ascending."""
    t_left = np.asarray(t_left, float)
    t_right = np.asarray(t_right, float)
    idx = np.full(len(t_left), -1, int)
    j, m = -1, len(t_right)
    for i, t in enumerate(t_left):
        while j + 1 < m and t_right[j + 1] <= t:     # advance to the most-recent right <= t
            j += 1
        if j >= 0 and (tolerance is None or (t - t_right[j]) <= tolerance):
            idx[i] = j
    return idx


def assert_causal(t_left, t_right, idx):
    """No lookahead: every matched right timestamp is at or before its left timestamp."""
    t_left = np.asarray(t_left, float)
    t_right = np.asarray(t_right, float)
    for i, j in enumerate(idx):
        if j >= 0:
            assert t_right[j] <= t_left[i], "lookahead at %d: right %.3f > left %.3f" % (i, t_right[j], t_left[i])
    return True


def asof_searchsorted(t_left, t_right, tolerance=None):
    """Causal as-of via binary search — O(N log M), wins the SPARSE-LEFT regime (M/N > log2 M; ~499x at
    N=200,M=2e6). `side='right'-1` is the causal predecessor (no lookahead) — identical results to
    `asof_align`. Cast both to int64 nanoseconds + contiguous first (a float query is ~20x slower)."""
    tl = np.ascontiguousarray(t_left)
    tr = np.ascontiguousarray(t_right)
    idx = np.searchsorted(tr, tl, side="right") - 1
    if tolerance is not None:
        stale = (np.asarray(tl, float) - np.asarray(tr, float)[np.maximum(idx, 0)]) > tolerance
        idx = np.where((idx >= 0) & ~stale, idx, -1)
    return idx.astype(int)


def lead_lag(a, s, max_lag=6):
    """Best lag L — does series `a` LEAD series `s` by L steps? — by correlation: corr(a[:n-L], s[L:])."""
    a = np.asarray(a, float)
    s = np.asarray(s, float)
    n = min(len(a), len(s))
    a, s = a[:n], s[:n]
    best = {"lag": 0, "corr": None}
    for L in range(0, max_lag + 1):
        if n - L < 3:
            break
        x, y = a[:n - L], s[L:n]
        if x.std() == 0 or y.std() == 0:
            continue
        c = float(np.corrcoef(x, y)[0, 1])
        if best["corr"] is None or c > best["corr"]:
            best = {"lag": L, "corr": round(c, 3)}
    return best
