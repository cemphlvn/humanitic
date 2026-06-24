"""
synthetic_personas — a HUMAN-BEHAVIOR LATENT ENGINE. Generate synthetic personas (à la NVIDIA
Nemotron-Personas: occupation archetype, risk appetite, herd tendency), aggregate their behavior into
a market SENTIMENT process, and drive a regime-switching market from it:

    synthetic humans  ->  aggregate sentiment (herd feedback)  ->  regime  ->  prices

The market is a FUNCTION of synthetic human behavior, not exogenous noise — so a backtest here is a
backtest on "nemotron-alike" synthetic data. Deterministic given a seed; numpy only.
"""
import numpy as np

# Nemotron occupation -> market-participant archetype: (name, base risk appetite, herd tendency)
ARCHETYPES = [
    ("retail",        0.55, 0.80),     # high herd, moderate appetite
    ("institutional", 0.50, 0.30),     # disciplined, low herd
    ("insider",       0.45, 0.10),     # informed, contrarian-ish
]
REGIME_DYNAMICS = [(0.0008, 0.008), (-0.0010, 0.016), (0.0, 0.006)]   # risk_on / risk_off / chop


def generate_personas(n, seed=0):
    rng = np.random.default_rng(seed)
    arch = rng.integers(0, len(ARCHETYPES), n)
    appetite = np.clip([ARCHETYPES[a][1] + rng.normal(0, 0.1) for a in arch], 0.0, 1.0)
    herd = np.array([ARCHETYPES[a][2] for a in arch])
    return {"archetype": arch, "appetite": np.asarray(appetite), "herd": herd}


def persona_market(n_days=1500, n_personas=2000, seed=0, p0=100.0):
    rng = np.random.default_rng(seed)
    P = generate_personas(n_personas, seed)
    herd_mean, appetite_mean = float(P["herd"].mean()), float(P["appetite"].mean())

    sentiment = np.zeros(n_days)
    regime = np.zeros(n_days, dtype=int)
    s = 0.0
    for t in range(n_days):
        s = float(np.clip(0.9 * s + 0.1 * herd_mean * s + rng.normal(0, 0.15), -1.0, 1.0))  # herd feedback
        sentiment[t] = s
        regime[t] = 0 if s > 0.2 else (1 if s < -0.2 else 2)            # sentiment -> regime

    mus = np.array([REGIME_DYNAMICS[r][0] for r in regime]) * (0.5 + appetite_mean) + 0.0005 * sentiment
    sig = np.array([REGIME_DYNAMICS[r][1] for r in regime])
    prices = p0 * np.exp(np.cumsum(rng.normal(mus, sig)))
    return {"prices": prices, "regime_labels": regime,
            "regime_names": ["risk_on", "risk_off", "chop"],
            "sentiment": sentiment, "n_personas": n_personas}
