"""
paper — the paper / simulation execution engine. NO live capital. Fills a target weight with a
slippage floor and STOCHASTIC PARTIAL FILLS, tracks equity + drawdown, and logs the paper-vs-target
tracking error (the deployment-gap delta the critic watches before any promotion to live).

Best practice (NautilusTrader / Alpaca / QuantConnect, via research): never assume zero cost or full
fills — that is the paper-only fantasy that overstates edge 20-40%.
"""
import numpy as np
from foundation.backtest.fees_slippage import cost


class PaperBroker:
    def __init__(self, slippage_bps=5.0, partial_prob=0.10, rng=None):
        self.slippage_bps = slippage_bps
        self.partial_prob = partial_prob
        self.rng = rng if rng is not None else np.random.default_rng(0)
        self.w = 0.0
        self.equity = 1.0
        self.peak = 1.0
        self.max_dd = 0.0
        self._track = 0.0
        self.n = 0

    def step(self, target_w, r_asset):
        """Execute toward target_w against the next-bar return; return realized bar pnl."""
        delta = target_w - self.w
        if self.rng.random() < self.partial_prob:                 # stochastic partial fill
            delta *= self.rng.uniform(0.3, 0.9)
        new_w = self.w + delta
        pnl = new_w * r_asset - cost(self.w, new_w, self.slippage_bps)   # slippage floor
        self.equity *= (1.0 + pnl)
        self.peak = max(self.peak, self.equity)
        self.max_dd = min(self.max_dd, (self.equity - self.peak) / self.peak)
        self._track += abs(target_w - new_w)                      # deployment-gap delta
        self.n += 1
        self.w = new_w
        return pnl

    @property
    def drawdown(self):
        return (self.equity - self.peak) / self.peak

    @property
    def mean_tracking_err(self):
        return self._track / max(self.n, 1)
