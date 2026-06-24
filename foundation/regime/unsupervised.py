"""
unsupervised — discover regimes with NO labels, mine them as atoms, and trade them DYNAMICALLY.

A thought attempt at a real edge (per the refutation ethos — most attempts should fail honestly):
  1. k-means (numpy, deterministic) DISCOVERS regimes in a feature space — no labels, no supervision.
  2. Walk-forward: each refit discovers regimes on the PAST only, learns each regime's mean next-return
     (the mined atom: discovered-regime -> market response), assigns the current state, and takes a
     position from that regime's learned return. Causal by construction (fit on [:t], earn r[t]).
  3. The realized positions go to the statistical court + a Granger-causality screen.

This predicts the regime structure, not a seasonal cycle — the answer to the confound the court caught.
The synthetic world here has a REAL planted regime edge; on a noise world it finds nothing. Real data
(deseasonalized) is the only honest test of a live edge.
"""
import numpy as np


def kmeans(X, k, iters=50, seed=0):
    """Deterministic numpy k-means -> (labels, centroids)."""
    X = np.asarray(X, float)
    rng = np.random.default_rng(seed)
    n = len(X)
    c = X[rng.choice(n, min(k, n), replace=False)].copy()
    lab = np.zeros(n, int)
    for _ in range(iters):
        lab = ((X[:, None, :] - c[None, :, :]) ** 2).sum(2).argmin(1)
        newc = np.array([X[lab == j].mean(0) if np.any(lab == j) else c[j] for j in range(len(c))])
        if np.allclose(newc, c):
            break
        c = newc
    return lab, c


def synth_regime_world(n=1000, k=3, edges=(0.003, -0.002, 0.0), persist=0.85, noise=0.01, seed=0):
    """A hidden persistent regime walk where the regime at t drives the return at t+1 (a genuine LAG, not a
    seasonal cycle). Features are noisy observations of the current regime — a cleaner read of it than the
    return's own past, so the feature genuinely Granger-causes the return."""
    rng = np.random.default_rng(seed)
    reg = np.zeros(n, int)
    for i in range(1, n):
        reg[i] = reg[i - 1] if rng.random() < persist else int(rng.integers(k))
    e = np.array(edges[:k], float)
    fwd = np.empty(n)
    fwd[0] = rng.normal(0, noise)
    fwd[1:] = e[reg[:-1]] + rng.normal(0, noise, n - 1)        # return at t <- regime at t-1 (the lead)
    centers = rng.normal(0, 1.5, (k, 2))
    feat = centers[reg] + rng.normal(0, 0.5, (n, 2))
    return feat, fwd, reg


def dynamic_trade(features, fwd, k=3, warmup=150, refit_every=25, seed=0, lookback=None):
    """Walk-forward unsupervised 1-step-ahead trading: discover regimes on the PAST, learn each regime's
    mean NEXT return (regime(X[i]) -> r[i+1]), assign the current state, take the position, earn r[t+1].
    Causal by construction. `lookback` bounds the refit window (rolling regimes — keeps long histories
    O(n) and memory-safe; None = expanding/all-past). Returns (positions, next returns) + the mined atoms."""
    X = np.asarray(features, float)
    r = np.asarray(fwd, float)
    n = len(r)
    pos = np.zeros(n)
    c = None
    rmean = None
    last = -10 ** 9
    for t in range(warmup, n - 1):
        if c is None or (t - last) >= refit_every:
            w0 = max(0, t - lookback) if lookback else 0       # rolling window (bounded) or all-past
            lab, c = kmeans(X[w0:t], k, seed=seed)             # discover regimes on the PAST only
            rloc = r[w0 + 1:t]                                 # r[i+1] for i in w0..t-2
            labp = lab[:len(rloc)]
            rmean = np.array([rloc[labp == j].mean() if np.any(labp == j) else 0.0
                              for j in range(len(c))])          # atom: regime(X[i]) -> next return r[i+1]
            last = t
        j = int(((X[t] - c) ** 2).sum(1).argmin())
        pos[t] = np.sign(rmean[j]) * min(1.0, abs(rmean[j]) / (np.std(rmean) + 1e-12))
    return (pos[warmup:n - 1], r[warmup + 1:n],
            {"centroids": c.tolist(), "regime_return": [float(round(x, 5)) for x in rmean]})


def edge_report(n=900, k=3, seed=0):
    """Run the unsupervised dynamic trader on the synthetic regime world; judge by the court + Granger."""
    from foundation.eval import significance, causality
    feat, fwd, _ = synth_regime_world(n=n, k=k, seed=seed)
    pos, r, atoms = dynamic_trade(feat, fwd, k=k, seed=seed)
    return {"court": significance.court(pos, r, seed=seed + 1),
            "granger": causality.granger_causality(feat[:, 0], fwd, lags=3, seed=seed + 1),
            "mined_atoms": atoms,
            "note": "unsupervised k-means regime discovery + walk-forward dynamic trading on a SYNTHETIC "
                    "regime world — a thought attempt. A real edge needs real, deseasonalized data."}
