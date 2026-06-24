"""
vsa_mlx — the FHRR VSA primitives on MLX (Apple Silicon, unified memory, Metal GPU).

WHY MLX FOR VSA: bind/bundle/similarity/cleanup are MEMORY-BANDWIDTH-BOUND. Apple Silicon's unified
memory (CPU + GPU share one high-bandwidth pool, zero host<->device copies) is the local analog of
the on-chip-SRAM thesis (Groq / Cerebras) — the right substrate for these ops, and the opposite of a
matmul-systolic TPU (the worst fit for VSA). This is an OPTIONAL, import-guarded backend, validated
against the numpy `vsa` floor; the floor stays numpy.

MLX best practices applied (ml-explore docs, via context7):
  - unified memory: arrays auto-reside in one pool; no .to(device) transfers
  - lazy evaluation: ops build a graph; force at the boundary (np.array / .item / mx.eval)
  - mx.compile: FUSE the hot elementwise ops (bind, similarity) -> fewer memory passes (the fusion
    win that matters most for bandwidth-bound work)
  - complex64 is a first-class dtype
"""
import numpy as np
import mlx.core as mx

D_DEFAULT = 4096


def rand_hv(D, rng):
    """A fresh concept = random phases on the unit circle (built from a numpy rng for determinism)."""
    theta = rng.uniform(-np.pi, np.pi, D)
    return mx.array(np.exp(1j * theta).astype(np.complex64))


_bind = mx.compile(lambda a, b: a * b)                     # FUSED: phases add, perfectly coalesced
_sim = mx.compile(lambda a, b: mx.mean(mx.real(a * mx.conj(b))))   # FUSED: multiply-then-reduce


def bind(a, b):
    return _bind(a, b)


def unbind(c, b):
    return c * mx.conj(b)


def bundle(vs):
    s = mx.sum(mx.stack(list(vs), axis=0), axis=0)         # reduction over the stack
    return s / mx.abs(s)


def permute(v, shift=1):
    s = shift % v.shape[0]
    return v if s == 0 else mx.concatenate([v[-s:], v[:-s]], axis=0)


def similarity(a, b):
    return float(_sim(a, b).item())                        # forces eval at the scalar boundary


def cleanup(v, codebook, k=1):
    sims = mx.real(mx.matmul(codebook, mx.conj(v))) / v.shape[0]   # one matvec
    order = np.array(mx.argsort(sims))[::-1][:k]            # k largest (argsort is ascending)
    return order, np.array(sims)[order]


def selftest():
    """The four VSA laws, measured on MLX — must match the numpy floor."""
    rng = np.random.default_rng(0)
    D = D_DEFAULT
    a, b, c = rand_hv(D, rng), rand_hv(D, rng), rand_hv(D, rng)
    mem = bundle([a, b, c])
    book = mx.stack([rand_hv(D, rng) for _ in range(100)], axis=0)
    noisy = book[7] * mx.array(np.exp(1j * rng.normal(0, 0.5, D)).astype(np.complex64))
    idx, s = cleanup(noisy, book, 1)
    return {
        "orthogonality |a.b|": abs(similarity(a, b)),
        "bind->unbind recovers": similarity(unbind(bind(a, b), b), a),
        "bundle keeps a": similarity(mem, a),
        "cleanup recovered #%d" % int(idx[0]): float(s[0]),
    }
