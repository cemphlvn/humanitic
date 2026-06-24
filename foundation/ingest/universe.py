"""
universe — survivorship-safe membership. Backtesting on TODAY's constituents includes only the survivors
(it silently drops delisted firms / failed tokens / dead exchanges), overstating returns by ~2-5%/yr. The
fix is an entry/exit-dated membership file; `members_as_of(t)` returns who was ACTUALLY in the universe at
t — including names that later failed. (CRSP PERMNO / delisting-aware universes, numpy-free.)
"""
from collections import namedtuple

Member = namedtuple("Member", "asset entry exit reason")        # exit=None => still active


class Universe:
    def __init__(self, members):
        self.members = [m if isinstance(m, Member) else Member(*m) for m in members]

    def members_as_of(self, t):
        return sorted(m.asset for m in self.members
                      if m.entry <= t and (m.exit is None or t < m.exit))
