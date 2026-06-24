"""
cross_seam — THE CORE SEAM. Different embedding models have different NATIVE TOPOLOGIES. Aligned to
one regime space (orthogonal Procrustes — the validated best practice), their AGREEMENT is robust
signal and their DISAGREEMENT — the seam — is information. We cross-trade the ENSEMBLE of topologies
against the market: take the CONSENSUS regime, size by agreement (confidence), shrink to zero as the
seam widens.

Platonic Representation Hypothesis: good models converge to a shared structure, so a rigid rotation
aligns them — and the RESIDUAL after alignment is exactly the seam. Reuses news_probe's Procrustes.
Conservative by construction (capped, agreement-weighted).
"""
import numpy as np
from foundation.regime import news_probe


def align_models(sources, targets):
    """One orthogonal-Procrustes map per model topology.
    sources: list of (n, d_m) anchor embeddings (one array per model); targets: (n, d_t) regime vecs."""
    return [news_probe.fit_translation(S, targets) for S in sources]


def cross_predict(Ws, embeddings, regime_codebook, names):
    """Each model translates its own embedding -> nearest regime. Return the per-model votes, the
    CONSENSUS (modal regime), the AGREEMENT (modal fraction), and the DIVERGENCE (the seam width)."""
    preds = [news_probe.predict_regime(W, e, regime_codebook, names)[0]
             for W, e in zip(Ws, embeddings)]
    vals, counts = np.unique(preds, return_counts=True)
    consensus = str(vals[int(np.argmax(counts))])
    agreement = float(counts.max()) / len(preds)
    return {"per_model": preds, "consensus": consensus,
            "agreement": agreement, "divergence": 1.0 - agreement}


def seam_signal(cross, regime_to_dir, max_gross=0.25):
    """Cross-trade the seam: the consensus regime's direction, sized by AGREEMENT (confidence), shrunk
    toward zero as the seam widens. Conservative — never exceeds max_gross."""
    direction = regime_to_dir.get(cross["consensus"], 0.0)
    size = max_gross * cross["agreement"]              # wide seam (low agreement) -> small position
    return float(np.clip(direction * size, -max_gross, max_gross))
