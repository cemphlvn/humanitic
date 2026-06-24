"""
embodied — the regime kernel FUSED across domains.

The VSA bind/bundle/cleanup substrate and JEPA-lite are DOMAIN-AGNOSTIC: a market regime and a robot's
state are both just *latent regimes*. So the SAME kernel encodes either, and the SAME JEPA predicts
either's transition; a VLA model (Pi0 / Gr00t / OpenVLA) is the ACTION head on top. Markets are one
instance of the latent-regime kernel; embodiment is another.

  market:    macro features  -> VSA regime -> JEPA(next regime | macro event)   -> weight (strategy)
  embodied:  scene features  -> VSA regime -> JEPA(next state  | action event)  -> action (VLA policy)

The VSA+JEPA regime layer runs HERE (Mac / MLX, the memory-bound primitives, fused via the harness).
The VLA action policies are GPU models that run on remote NVIDIA (operator/vla.py). One substrate, many
policy heads — and the same conservation accounting (edge in bits, capacity C(D)) governs both.
"""
from foundation.index import store        # encode_regime (VSA) — the shared substrate
from foundation.regime import jepa          # JEPA-lite transition — the shared world-model


def encode_embodied(features):
    """An embodied state (e.g. ['phase:reach', 'gripper:open', 'object:detected']) -> one VSA regime
    vector — the SAME encode the market regime layer uses. Robots and markets share the substrate."""
    return store.encode_regime(features)


# Fusing a VLA latent stream with the world-model IS fitting the shared JEPA on it:
fuse_vla_jepa = jepa.fit                     # (latent_t, event_t, latent_next, ridge) -> W


def embodied_world_model(n=500, R=4, d=48, p_event=0.3, seed=0):
    """A VLA-like latent transition stream (state + action-event -> next state), generated the SAME way
    as market regimes — to show the kernel fuses. Returns jepa's tuple (lt, ev, ln, lab_t, lab_n, L)."""
    return jepa.make_transition_data(n=n, R=R, d=d, p_event=p_event, seed=seed)
