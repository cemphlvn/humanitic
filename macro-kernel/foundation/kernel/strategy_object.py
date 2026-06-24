"""
StrategyObject — the atomic product primitive of the Macro Strategy OS.
Not a trade: a tested, revisable object. Its execution face is the weight-vector contract.

The ordered (NON-ABELIAN) pipeline selection -> allocation -> timing -> risk lives HERE,
in the operator layer — never inside the abelian VSA regime substrate. This split is forced
by the LABNOTES: the substrate is taxed on non-commutative composition, so the agent/operator
loop carries the ordered pipeline, exactly as it carries depth past the TC0 ceiling.
"""
from dataclasses import dataclass, field
from typing import Callable


@dataclass
class StrategyObject:
    thesis: str
    selection: Callable     # which asset(s) are in play at t     -> base
    allocation: Callable    # how much                            -> weights
    timing: Callable        # when (entry/exit gate)              -> scaled
    risk: Callable          # risk overlay (caps, vol target)     -> final weight
    regime_assumptions: str = ""
    data_sources: tuple = ()
    validation_results: dict = field(default_factory=dict)
    post_trade_memory: list = field(default_factory=list)

    def target_weight(self, prices, t):
        # order matters (non-commutative) BY DESIGN — this is the operator-layer composition
        w = self.selection(prices, t)
        w = self.allocation(prices, t, w)
        w = self.timing(prices, t, w)
        w = self.risk(prices, t, w)
        return w
