"""
Baseline strategies for the evidence court. Clean ones obey the contract (use only
prices[:t+1]); the leaky one PEEKS at tomorrow — kept ONLY so the leakage-guard has
something real to catch. A court that can't catch a known cheat can't be trusted.
"""
import numpy as np
from foundation.kernel.strategy_object import StrategyObject


def _past_return(prices, t, k):
    if t < k:
        return 0.0
    return prices[t] / prices[t - k] - 1.0            # only past data — causal


def momentum(k=20, max_w=1.0):
    """CLEAN: long if k-day past return positive, short if negative."""
    def selection(prices, t): return 1.0
    def allocation(prices, t, base): return base * float(np.sign(_past_return(prices, t, k)))
    def timing(prices, t, w): return w
    def risk(prices, t, w): return float(np.clip(w, -max_w, max_w))
    return StrategyObject(
        thesis="price momentum persists over ~k days",
        regime_assumptions="trending (abelian / cyclic) regime — the substrate's native lane",
        selection=selection, allocation=allocation, timing=timing, risk=risk,
    )


def leaky_oracle():
    """LEAKY (forbidden): uses tomorrow's price. The court MUST reject this."""
    def selection(prices, t): return 1.0
    def allocation(prices, t, base):
        if t + 1 >= len(prices):
            return 0.0
        return base * float(np.sign(prices[t + 1] / prices[t] - 1.0))   # PEEK at t+1
    def timing(prices, t, w): return w
    def risk(prices, t, w): return float(np.clip(w, -1.0, 1.0))
    return StrategyObject(thesis="(leaky) knows tomorrow",
                          selection=selection, allocation=allocation,
                          timing=timing, risk=risk)
