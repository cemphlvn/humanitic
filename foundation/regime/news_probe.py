"""
news_probe — the vector-TRANSLATION probe. Maps embeddings from a SOURCE semantic space (news and
other frontier sources) into the TARGET regime space, then reads market dynamics off the nearest
regime. This is the "news -> timeseries" predictor: embed source -> translate -> nearest regime ->
expected next-step dynamics.

Best practice for aligning two latent spaces (the cross-lingual embedding-alignment lineage —
Mikolov 2013, Smith 2017, Artetxe 2018): ORTHOGONAL PROCRUSTES. The orthogonal map W minimizing
||W S - R||_F has the closed form W = U Vᵀ from the SVD of R Sᵀ = U Σ Vᵀ. Orthogonal =
distance/angle preserving — the conservative, well-conditioned choice (no scaling blow-ups, no
overfit degrees of freedom). Offline, numpy SVD. (A 2026 latent-space survey is being digested into
the index to confirm/refine this choice.)
"""
import numpy as np


def fit_translation(source, target):
    """Orthogonal Procrustes: the best orthogonal W with W @ source[i] ≈ target[i].
    source: (n, d_s) real embeddings; target: (n, d_t) real regime vectors. Returns W: (d_t, d_s)."""
    S = np.asarray(source, float)
    R = np.asarray(target, float)
    U, _, Vt = np.linalg.svd(R.T @ S, full_matrices=False)     # R Sᵀ ... here Rᵀ S -> (d_t, d_s)
    return U @ Vt                                              # orthogonal, distance-preserving


def translate(W, s):
    """Carry a source embedding across into the regime space."""
    return W @ np.asarray(s, float)


def predict_regime(W, s, regime_codebook, names):
    """Translate a source embedding, return the nearest regime + cosine (the 'vector translation sim')."""
    t = translate(W, s)
    book = np.asarray(regime_codebook, float)
    sims = (book @ t) / (np.linalg.norm(book, axis=1) * (np.linalg.norm(t) + 1e-12) + 1e-12)
    j = int(np.argmax(sims))
    return names[j], float(sims[j])
