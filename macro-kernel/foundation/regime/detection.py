"""
detection — NEW-REGIME and CHAOS detection. Flags regime SHIFTS (change-points) and estimates
PREDICTABILITY, tied to the conservation spine's KAM wall: below the effective coupling the market is
predictable; above it lambda>0 and the long-horizon edge is gone. Feeds the autonomous core (a
detected shift -> re-audit / cut exposure) and the health monitor.
"""
import numpy as np
from foundation.spine.conservation import KAM_THRESHOLD  # noqa: F401  (the KAM scale this maps to)


def returns(prices):
    p = np.asarray(prices, float)
    return p[1:] / p[:-1] - 1.0


def effective_coupling(rets, window=20):
    """A chaos proxy ~ the market's effective Chirikov coupling: recent realized vol over baseline.
    ~1 in a stationary regime; >1 means elevated chaos (less predictable)."""
    r = np.asarray(rets, float)
    if len(r) < window:
        return 1.0
    return float(np.std(r[-window:]) / (np.std(r) + 1e-12))


def predictability(rets, window=20):
    """0..1: how predictable the current regime is. Falls as the coupling exceeds the KAM scale."""
    return float(np.clip(2.0 - max(effective_coupling(rets, window), 1.0), 0.0, 1.0))


def detect_regime_shift(prices, window=30, z=3.0):
    """Change-point detection on the return mean (a standardized two-window statistic). Returns the
    shift indices, whether the LATEST window is a fresh regime (new-regime detection), and the current
    predictability."""
    r = returns(prices)
    if len(r) < 2 * window:
        return {"shifts": [], "new_regime": False, "predictability": predictability(r, window)}
    raw = []
    for t in range(window, len(r) - window):
        before, after = r[t - window:t], r[t:t + window]
        s = abs(after.mean() - before.mean()) / (before.std() / np.sqrt(window) + 1e-12)
        if s > z:
            raw.append(int(t))
    shifts = [s for i, s in enumerate(raw) if i == 0 or s - raw[i - 1] > window]   # dedup nearby
    new_regime = bool(shifts and shifts[-1] > len(r) - 2 * window)
    return {"shifts": shifts, "new_regime": new_regime, "predictability": predictability(r, window)}
