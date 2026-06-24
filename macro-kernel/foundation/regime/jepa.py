"""
jepa — a JEPA-lite REGIME-TRANSITION predictor. Predict the NEXT regime LATENT, not the price.

JEPA (Joint-Embedding Predictive Architecture) predicts in LATENT space: given where you are now
(the current regime latent) and a context signal, predict the embedding of what comes next — never
the raw observation. Here the "observation" we refuse to predict is price; the latent we DO predict
is the regime. A regime r has a fixed real signature L[r] (dim d). Markets mostly STAY in a regime;
they JUMP on macro events (a rate decision, a CPI print). So the next-regime latent is a function of
(current latent | macro-event vector), and we learn that function with one closed-form linear map.

WHY the macro event lets it beat persistence
--------------------------------------------
Persistence — "tomorrow's regime = today's regime" — is the honest baseline. It is right exactly on
the no-jump steps and BLIND on every transition: it cannot know a jump is coming because it never
looks at the event. Our generator makes transitions EVENT-DRIVEN: a step jumps to regime r' iff a
macro event carrying r''s signature Ev[r'] fired; quiet steps (event ≈ noise) stay put. The linear
predictor reads that event signature and routes the prediction to L[r'], so it is right on the
transitions persistence misses — that gap (event-driven jumps) is precisely the edge over persistence.

Closed form: a ridge least-squares map W from X=[latent_t | event_t] to Y=latent_next,
W = (XᵀX + ridge·I)⁻¹ Xᵀ Y. Offline, numpy only, deterministic (np.random.default_rng(seed)).
"""
import numpy as np


def make_transition_data(n, R=4, d=48, p_event=0.3, seed=0):
    """Synthetic regime-transition stream where macro events CAUSE the transitions.

    Each regime r has a fixed latent L[r] (the thing we predict). Each target regime r' has a fixed
    macro-event signature Ev[r'] (the thing that announces a jump to r'). With prob p_event a step
    fires an event toward a random r' (event = Ev[r'] + noise) and the next regime BECOMES r'; else
    the step is quiet (event ≈ noise) and the regime STAYS. So events are INFORMATIVE about
    transitions and the next latent is a clean function of (current latent | event).

    Returns
      latent_t   (n, d)  current regime latent (+ small noise)
      event_t    (n, d)  macro-event vector for the step
      latent_next(n, d)  next regime latent (+ small noise) — the JEPA target
      label_t    (n,)    current regime index in [0, R)
      label_next (n,)    next   regime index in [0, R)
      L          (R, d)  the regime latents / centroids
    """
    rng = np.random.default_rng(seed)
    L = rng.normal(size=(R, d))                 # fixed regime latents (the predictable space)
    Ev = rng.normal(size=(R, d))                # fixed event signatures: Ev[r'] announces "jump to r'"

    label_t = np.empty(n, dtype=int)
    label_next = np.empty(n, dtype=int)
    event_t = np.empty((n, d))

    cur = int(rng.integers(0, R))               # walk a real sequence of regimes
    for i in range(n):
        label_t[i] = cur
        if rng.random() < p_event:              # a macro event fires -> jump to a random target r'
            tgt = int(rng.integers(0, R))
            event_t[i] = Ev[tgt] + rng.normal(0, 0.3, d)
            cur = tgt                            # transition is CAUSED by the event
        else:                                    # quiet step: event ≈ noise, regime stays
            event_t[i] = rng.normal(0, 0.3, d)
        label_next[i] = cur

    latent_t = L[label_t] + rng.normal(0, 0.05, (n, d))      # latents are clean, lightly dithered
    latent_next = L[label_next] + rng.normal(0, 0.05, (n, d))
    return latent_t, event_t, latent_next, label_t, label_next, L


def fit(latent_t, event_t, latent_next, ridge=1e-2):
    """Closed-form ridge regression of [latent_t | event_t] -> latent_next.
    W = (XᵀX + ridge·I)⁻¹ Xᵀ Y, shape (2d, d). One legible linear JEPA predictor."""
    X = np.concatenate([np.asarray(latent_t, float), np.asarray(event_t, float)], axis=1)  # (n, 2d)
    Y = np.asarray(latent_next, float)                                                     # (n, d)
    A = X.T @ X + ridge * np.eye(X.shape[1])                                                # (2d, 2d)
    return np.linalg.solve(A, X.T @ Y)                                                      # (2d, d)


def predict(W, latent_t, event_t):
    """Predicted next latent = [latent_t | event_t] @ W. Works on one row or a batch."""
    lt = np.atleast_2d(np.asarray(latent_t, float))
    ev = np.atleast_2d(np.asarray(event_t, float))
    X = np.concatenate([lt, ev], axis=1)
    out = X @ W
    return out[0] if out.shape[0] == 1 else out


def nearest_regime(latent, centroids):
    """Snap a (possibly noisy/predicted) latent to a regime: argmax cosine. Row or batch."""
    lat = np.atleast_2d(np.asarray(latent, float))
    book = np.asarray(centroids, float)
    sims = (lat @ book.T) / (
        np.linalg.norm(lat, axis=1, keepdims=True) * np.linalg.norm(book, axis=1)[None, :] + 1e-12
    )
    idx = np.argmax(sims, axis=1)
    return int(idx[0]) if idx.shape[0] == 1 else idx


def evaluate(W, latent_t, event_t, label_next, centroids):
    """JEPA next-regime accuracy: predict the latent, snap to nearest regime, compare to truth."""
    pred = predict(W, latent_t, event_t)
    return float(np.mean(nearest_regime(pred, centroids) == np.asarray(label_next)))


def persistence_accuracy(label_t, label_next):
    """Baseline: assume the regime STAYS (next = current). Blind to events by construction."""
    return float(np.mean(np.asarray(label_t) == np.asarray(label_next)))
