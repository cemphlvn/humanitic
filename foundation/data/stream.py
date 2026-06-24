"""
stream — STREAMING inputs as (robot, market) PAIRS arriving one at a time (online), the shape real open
feeds take. Open protocols: robot frames follow **RLDS** (Open-X-Embodiment's open episode format),
market frames follow **OHLC**; dataset metadata follows **Croissant** and provenance **OpenLineage**
(see foundation/data/sources.py). A ReplayStream replays a deterministic sequence — the OFFLINE eval
floor (Article 0: no network in the system path). Live adapters (Stooq market, Open-X-Embodiment robot)
plug into the SAME interface at runtime. The consumer is PREQUENTIAL: test on each pair before training.
"""
from collections import namedtuple
import numpy as np

from foundation.regime import jepa

# one streaming training tuple: current state (robot signal in market context), the market/action event
# that drives the transition, the next-state latent (JEPA target), and the regime labels for scoring.
Pair = namedtuple("Pair", "t state event next_state regime regime_next")


class ReplayStream:
    """Replays an ordered sequence of Pairs (deterministic, offline). Same interface a live feed fills."""
    def __init__(self, pairs):
        self._pairs = list(pairs)

    def __iter__(self):
        return iter(self._pairs)

    def __len__(self):
        return len(self._pairs)

    def arrays(self):
        P = self._pairs
        return (np.array([p.state for p in P]), np.array([p.event for p in P]),
                np.array([p.next_state for p in P]),
                np.array([p.regime for p in P]), np.array([p.regime_next for p in P]))


def paired_replay(n=600, R=4, d=48, p_event=0.3, seed=0):
    """Build a deterministic real-STRUCTURED paired stream (event-driven regime transitions). At runtime
    the live Stooq + Open-X-Embodiment adapters replace this with real frames over the same Pair shape."""
    lt, ev, ln, lab_t, lab_n, L = jepa.make_transition_data(n, R, d, p_event, seed)
    pairs = [Pair(i, lt[i], ev[i], ln[i], int(lab_t[i]), int(lab_n[i])) for i in range(n)]
    return ReplayStream(pairs), L
