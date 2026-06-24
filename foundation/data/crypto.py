"""
crypto — crypto-PROJECT dynamics as a timestamped, OPEN-data market stream, plus a time-mapped robotic
track that shares the same latent regime. Dynamics = an event-driven regime walk (risk_on / risk_off /
churn) on its OWN IRREGULAR clock (trades arrive irregularly); the robot stream samples the SAME latent
regime on its OWN regular clock. Time-aligning the two (foundation/data/align.py) is the cross-domain
join. Offline we generate real-STRUCTURED dynamics; at runtime open adapters (CoinGecko / DefiLlama /
Base RPC) fill the same shape. On-chain crypto activity is public by construction — open data.
"""
import numpy as np

from foundation.regime import jepa


def crypto_dynamics(n=800, R=4, d=48, p_event=0.3, seed=0):
    """Event-driven crypto regime walk on an IRREGULAR clock. Returns a dict: t (ascending irregular
    timestamps), feat/event/next_latent (n,d), regime/regime_next (n,), L (R,d centroids)."""
    lt, ev, ln, lab_t, lab_n, L = jepa.make_transition_data(n, R, d, p_event, seed)
    rng = np.random.default_rng(seed + 99)
    t = np.cumsum(0.5 + rng.exponential(1.0, n))             # irregular inter-arrival (trades cluster)
    return {"t": t, "feat": lt, "event": ev, "next_latent": ln,
            "regime": lab_t, "regime_next": lab_n, "L": L}


def robot_track(crypto, seed=0, cadence=1.0):
    """A robotic data stream on its OWN regular clock embodying the SAME latent regime the crypto process
    is in at each moment (causal: the most-recent crypto regime at or before t_r). Returns t_r, robot."""
    t_c, L, reg = crypto["t"], crypto["L"], crypto["regime"]
    rng = np.random.default_rng(seed)
    t_r = np.arange(float(t_c[0]), float(t_c[-1]), cadence)
    j = np.clip(np.searchsorted(t_c, t_r, side="right") - 1, 0, len(reg) - 1)
    robot = L[reg[j]] + rng.normal(0, 0.15, (len(t_r), L.shape[1]))
    return t_r, robot
