"""
Regime-switching synthetic market. A Markov chain over regimes; each regime carries its
own (drift, vol). Returns POINT-IN-TIME arrays + GROUND-TRUTH regime labels, so the regime
layer can be graded and the backtest stays honest. Deterministic given a seed (no wall clock).
This runs offline on this Mac — zero deps beyond numpy, zero network, zero credentials.
"""
import numpy as np

REGIMES = [                # (name, daily_mu, daily_sigma)
    ("bull",  0.0006, 0.008),
    ("bear", -0.0007, 0.013),
    ("chop",  0.0000, 0.006),
]
TRANS = np.array([         # sticky transition matrix — regimes persist
    [0.97, 0.02, 0.01],
    [0.02, 0.96, 0.02],
    [0.02, 0.02, 0.96],
])


def generate(n_days=1500, seed=0, p0=100.0):
    rng = np.random.default_rng(seed)
    n = len(REGIMES)
    labels = np.empty(n_days, dtype=int)
    s = 0
    for i in range(n_days):
        labels[i] = s
        s = rng.choice(n, p=TRANS[s])
    mus = np.array([REGIMES[k][1] for k in labels])
    sigmas = np.array([REGIMES[k][2] for k in labels])
    shocks = rng.normal(mus, sigmas)
    prices = p0 * np.exp(np.cumsum(shocks))
    return {"prices": prices,
            "regime_labels": labels,
            "regime_names": [r[0] for r in REGIMES]}
