"""
prequential — research-grade MEASUREMENT & EVALS for streaming inputs, following the OPEN prequential
protocol (interleaved test-then-train; Gama et al.; the river / scikit-multiflow standard).

The model is TRAINED ONLINE: for each pair past warmup it PREDICTS the next regime using a predictor fit
on the strict PAST (no leakage), scores it, then periodically refits on the expanding past. Returns a
portable, open-shaped metrics dict: prequential accuracy, persistence baseline, lift, skill in BITS, and
the capacity reference C(D)=0.386·D. Edge is reported in bits and never claimed past the wall.
"""
import math
import numpy as np

from foundation.regime import jepa


def _skill_bits(acc, R, n):
    """Per-decision skill in bits = (skill above chance, normalized) × max info log2(R); total over n.
    0 at chance, log2(R) when perfect — honest and capacity-aware."""
    chance = 1.0 / R
    norm = max(0.0, (acc - chance) / (1.0 - chance))
    per = norm * math.log2(R)
    return per, per * n


def prequential_eval(stream_arrays, L, warmup=120, refit_every=20, ridge=1e-2, D=4096):
    state, event, nxt, regime, regime_next = stream_arrays
    n = len(state)
    R = L.shape[0]
    W = jepa.fit(state[:warmup], event[:warmup], nxt[:warmup], ridge)
    last_fit = warmup
    correct = persist = total = 0
    for i in range(warmup, n):
        pred = jepa.nearest_regime(jepa.predict(W, state[i], event[i]), L)     # TEST: W from the strict past
        correct += int(pred == regime_next[i])
        persist += int(regime[i] == regime_next[i])                            # persistence baseline
        total += 1
        if (i - last_fit) >= refit_every:                                      # TRAIN: refit on past (< i)
            W = jepa.fit(state[:i], event[:i], nxt[:i], ridge)
            last_fit = i
    acc = correct / total
    base = persist / total
    bits_per, bits_total = _skill_bits(acc, R, total)
    cap = 0.386 * D
    return {
        "protocol": "prequential (interleaved test-then-train)",
        "n": total, "warmup": warmup, "refit_every": refit_every,
        "prequential_acc": round(acc, 4), "persistence": round(base, 4), "lift": round(acc - base, 4),
        "skill_bits_per_decision": round(bits_per, 4), "skill_bits_total": round(bits_total, 2),
        "capacity_bits_C(D)": round(cap, 1), "capacity_exceeded": bool(bits_per > cap),
    }
