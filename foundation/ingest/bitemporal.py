"""
bitemporal — point-in-time correctness, the FOUNDATIONAL anti-look-ahead control.

Every macro fact has two timestamps: VALID time (the period it covers) and KNOWN time (when it was first
released/recorded). A naive store keeps one and conflates them -> look-ahead bias: the model "knows" a GDP
print before it was published. López de Prado (AFML) names this the foundational backtesting sin —
fundamentals are reported with a lag and often backfilled retroactively. This store is APPEND-ONLY
(vintages, never overwrite/delete) and answers "what was knowable at time T".
"""
from collections import namedtuple

Vintage = namedtuple("Vintage", "valid_from value known_from")   # known_from = release timestamp


class PointInTimeStore:
    def __init__(self):
        self._rows = []                                          # append-only list of Vintage

    def record(self, valid_from, value, known_from):
        """Append a vintage. A revision is a NEW row with a later known_from — never an overwrite."""
        self._rows.append(Vintage(valid_from, value, known_from))
        return self

    def latest_as_of(self, t, valid_from):
        """The value for one period as knowable at t (None if not yet released — no look-ahead)."""
        cand = [v for v in self._rows if v.valid_from == valid_from and v.known_from <= t]
        return max(cand, key=lambda v: v.known_from).value if cand else None

    def as_of(self, t):
        """Reconstruct the whole knowable state at t: per valid_from, the latest vintage with known_from <= t."""
        best = {}
        for v in self._rows:
            if v.known_from <= t and (v.valid_from not in best or v.known_from > best[v.valid_from].known_from):
                best[v.valid_from] = v
        return {vf: best[vf].value for vf in sorted(best)}
