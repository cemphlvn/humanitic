"""
cleanup — exact nearest-codeword cleanup over a VSA codebook (and regime centroids / atoms).

The research verdict, validated in .labs: at every realistic codebook size for a D=4096 system, an EXACT
matmul scan beats ANN. The bundle-capacity wall (M_max ≈ 0.386·D / log2(N)) caps how many items can be
superposed, so the ANN crossover (N≈50k–200k) is never reached; and approximate recall would break the
honesty contract — a silent cleanup miss propagates through every downstream VSA op. Two lines, no deps,
exact, provable. (Measured: N=1k → 0.49ms, N=10k → 4.9ms; recall 200/200 at σ=1.0 noise.)
"""
import math

import numpy as np


class Cleanup:
    """Exact nearest-codeword over a codebook (real bipolar or complex FHRR). Codebook normalized once."""
    def __init__(self, codebook, complex_=None):
        cb = np.asarray(codebook)
        self.cb = cb
        self.complex_ = np.iscomplexobj(cb) if complex_ is None else complex_
        self.cbn = cb / (np.linalg.norm(cb, axis=1, keepdims=True) + 1e-12)

    def _scores(self, query):
        q = np.asarray(query)
        q = q / (np.linalg.norm(q) + 1e-12)
        return np.real(self.cbn.conj() @ q) if self.complex_ else self.cbn @ q

    def nearest(self, query):
        return int(np.argmax(self._scores(query)))

    def topk(self, query, k=1):
        return list(np.argsort(self._scores(query))[-k:][::-1])


def bundle_capacity(D, n_codewords):
    """Max items superposable before cleanup degrades: M_max ≈ 0.386·D / log2(N) (Frady/Plate envelope)."""
    return 0.386 * D / math.log2(max(2, n_codewords))
