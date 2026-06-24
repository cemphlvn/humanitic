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
