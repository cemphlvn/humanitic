"""
vsa_mlx — FHRR VSA on MLX via the PHASE-ANGLE carrier (real float32), NOT complex64.

WHY ANGLES, NOT COMPLEX: FHRR over unit-complex vectors is ISOMORPHIC to arithmetic on phase angles.
GPU complex algebra is fragile — PyTorch MPS computes 1j*(-1j) = -1 (issue #148156), and its
conjugate / complex einsum / gather are wrong or crash; MLX's complex64 is likewise incomplete on
the GPU for some ops. The phase-angle carrier is the EXACT SAME algebra in float32 — fully
Metal-accelerated, zero broken-complex risk. (This is literally qFHRR's carrier.)

A hypervector is D real PHASES theta in [-pi, pi).
  bind   = theta_a + theta_b                     (cos-periodic downstream; no wrap needed)
  unbind = theta_c - theta_b
  bundle = atan2(sum sin theta, sum cos theta)   (circular-mean direction = the normalized resultant)
  sim    = mean(cos(theta_a - theta_b))          (== mean(Re a*conj(b)) for unit-complex a,b)
"""
import numpy as np
import mlx.core as mx

D_DEFAULT = 4096


def rand_hv(D, rng):
    return mx.array(rng.uniform(-np.pi, np.pi, D).astype(np.float32))      # phases, float32


_bind = mx.compile(lambda a, b: a + b)                                    # FUSED: phase add
_sim = mx.compile(lambda a, b: mx.mean(mx.cos(a - b)))                     # FUSED: diff -> cos -> reduce


def bind(a, b):
    return _bind(a, b)


def unbind(c, b):
    return c - b


def bundle(vs):
    S = mx.stack(list(vs), axis=0)
    return mx.arctan2(mx.sum(mx.sin(S), axis=0), mx.sum(mx.cos(S), axis=0))


def permute(v, shift=1):
    s = shift % v.shape[0]
    return v if s == 0 else mx.concatenate([v[-s:], v[:-s]], axis=0)


def similarity(a, b):
    return float(_sim(a, b).item())


def cleanup(v, codebook, k=1):
    """codebook: (N, D) phases. similarity per row = mean(cos(v - row)); return the top-k rows."""
    sims = mx.mean(mx.cos(v[None, :] - codebook), axis=1)
    order = np.array(mx.argsort(sims))[::-1][:k]
    return order, np.array(sims)[order]


def gpu_complex_trustworthy():
    """The FHRRBackend probe: does THIS device get complex algebra right? (PyTorch MPS does not:
    1j*conj(1j) -> -1.) We use the phase-angle carrier regardless — this just records whether a
    complex fast-path could ever be trusted here, future-proofing for a fixed driver."""
    try:
        z = mx.array(np.array([0 + 1j], dtype=np.complex64))
        return bool(np.isclose(np.array(z * mx.conj(z)).real[0], 1.0))
    except Exception:
        return False


def selftest():
    rng = np.random.default_rng(0)
    D = D_DEFAULT
    a, b, c = rand_hv(D, rng), rand_hv(D, rng), rand_hv(D, rng)
    mem = bundle([a, b, c])
    book = mx.stack([rand_hv(D, rng) for _ in range(100)], axis=0)
    noisy = book[7] + mx.array(rng.normal(0, 0.5, D).astype(np.float32))   # additive PHASE noise
    idx, s = cleanup(noisy, book, 1)
    return {
        "orthogonality |a.b|": abs(similarity(a, b)),
        "bind->unbind recovers": similarity(unbind(bind(a, b), b), a),
        "bundle keeps a": similarity(mem, a),
        "cleanup recovered #%d" % int(idx[0]): float(s[0]),
    }
