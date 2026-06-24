"""
The weight-vector contract — the stable interface between strategy logic and execution.
FinRL-X style: selection -> allocation -> timing -> risk ALL terminate in ONE object,
the target weight w_t. Everything upstream can change; this contract cannot.
A Strategy is anything that, given market state UP TO t, returns w_t (uses prices[:t+1]).
"""
import numpy as np


def validate_weights(w, max_gross=1.0):
    """Reject non-finite or over-leveraged weights. Works for scalar or vector w."""
    w = np.asarray(w, dtype=float)
    if not np.all(np.isfinite(w)):
        raise ValueError("weights must be finite")
    gross = float(np.sum(np.abs(w)))
    if gross > max_gross + 1e-9:
        raise ValueError(f"gross exposure {gross:.3f} exceeds max_gross {max_gross}")
    return w


class Strategy:
    """Protocol. Implement target_weight(prices, t) using ONLY prices[:t+1]."""
    def target_weight(self, prices, t):
        raise NotImplementedError
