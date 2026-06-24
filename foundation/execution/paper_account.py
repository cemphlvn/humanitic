"""
paper_account — PAPER TRADING (the finance term for trading with simulated / "dummy" money: a paper
account / demo account / forward test). No real capital is ever at risk — the LIVE gate stays shut.

A persistent ledger: it marks a position to market each bar, compounds equity, and tracks total return,
Sharpe, and max drawdown. State persists in `.local/paper/` (private), so "from now on" each run advances
the SAME account — a continuous forward test, not a one-off backtest.
"""
import numpy as np


class PaperAccount:
    def __init__(self, equity0=100_000.0, interval=None):
        self.equity0 = float(equity0)
        self.equity = float(equity0)
        self.curve = [float(equity0)]
        self.realized = 0.0
        self.peak = float(equity0)
        self.max_drawdown = 0.0
        self.n_steps = 0
        self.interval = interval                                # the fit-chosen trading timeframe (bars)

    def step(self, position, ret):
        """Advance one bar: pnl = position · return · equity; mark-to-market; track drawdown."""
        pnl = float(position) * float(ret) * self.equity
        self.equity += pnl
        self.realized += pnl
        self.curve.append(self.equity)
        self.peak = max(self.peak, self.equity)
        if self.peak > 0:
            self.max_drawdown = max(self.max_drawdown, (self.peak - self.equity) / self.peak)
        self.n_steps += 1
        return pnl

    def run(self, positions, returns):
        for p, r in zip(positions, returns):
            self.step(p, r)
        return self.summary()

    def summary(self):
        c = np.array(self.curve, float)
        rets = np.diff(c) / c[:-1] if len(c) > 1 else np.array([0.0])
        sharpe = float(rets.mean() / (rets.std() + 1e-12)) if len(rets) > 1 else 0.0
        return {"mode": "PAPER (simulated money; no live capital)",
                "interval": self.interval,
                "equity0": round(self.equity0, 2), "equity": round(self.equity, 2),
                "total_return": round(self.equity / self.equity0 - 1.0, 4),
                "sharpe": round(sharpe, 4), "max_drawdown": round(self.max_drawdown, 4),
                "n_steps": self.n_steps}

    def to_dict(self):
        return {"equity0": self.equity0, "equity": self.equity, "curve": self.curve,
                "realized": self.realized, "peak": self.peak,
                "max_drawdown": self.max_drawdown, "n_steps": self.n_steps, "interval": self.interval}

    @classmethod
    def from_dict(cls, d):
        a = cls(d["equity0"], interval=d.get("interval"))
        a.equity, a.curve, a.realized = d["equity"], list(d["curve"]), d["realized"]
        a.peak, a.max_drawdown, a.n_steps = d["peak"], d["max_drawdown"], d["n_steps"]
        return a
