"""
The five VSA primitives — the floor everything stands on. Written to be READ.
An FHRR hypervector is D complex numbers, each on the UNIT CIRCLE; the information
is in the PHASES. This is the gen-3 unit-modulus core / gen-5 FHRR torus kernel, verbatim.
Each op notes where it becomes a hardware kernel and where the bottleneck lives.
"""
import numpy as np


def rand_hv(D, rng):                                  # a fresh concept = random angles
    theta = rng.uniform(-np.pi, np.pi, D)
    return np.exp(1j * theta).astype(np.complex64)


def bind(a, b):                                       # ROLE <-> FILLER ("color IS red")
    return a * b                                      # complex multiply == phases ADD
    # KERNEL: thread i touches a[i],b[i] only. perfectly coalesced, fusable. best case.

def unbind(c, b):
    return c * np.conj(b)                             # subtract b's phase; bind is invertible


def bundle(vs):                                       # SUPERPOSITION (a set / a memory)
    s = np.sum(vs, axis=0)                            # add complex numbers  <- a REDUCTION
    return (s / np.abs(s)).astype(np.complex64)       # renormalize onto the circle
    # KERNEL: read-many -> write-one. bandwidth-bound. CAPACITY ENVELOPE wall lives here.


def permute(v, shift=1):                              # protect ORDER / sequence position
    return np.roll(v, shift)
    # KERNEL: pure gather. contiguous roll = coalesced; random permute = the bad case.


def similarity(a, b):                                 # how aligned are two memories?
    return float(np.mean(np.real(a * np.conj(b))))    # mean cos(delta-phase) == cosine
    # KERNEL: elementwise-multiply THEN reduce. the VSA search primitive.


def cleanup(v, codebook, k=1):                        # snap noise to clean concept(s)
    sims = np.real(codebook @ np.conj(v)) / v.shape[0]  # ONE matvec: every codeword vs v
    idx = np.argpartition(-sims, k)[:k]
    return idx, sims[idx]
    # KERNEL: "dequant matmul + top-k" — the lineage's top-k cleanup memory.


def selftest():
    """Return the four VSA laws as measured numbers."""
    rng = np.random.default_rng(0)
    D = 4096
    a, b, c = rand_hv(D, rng), rand_hv(D, rng), rand_hv(D, rng)
    mem = bundle([a, b, c])
    book = np.stack([rand_hv(D, rng) for _ in range(100)])
    noisy = book[7] * np.exp(1j * rng.normal(0, 0.5, D)).astype(np.complex64)
    idx, s = cleanup(noisy, book, 1)
    return {
        "orthogonality |a.b|": abs(similarity(a, b)),
        "bind->unbind recovers": similarity(unbind(bind(a, b), b), a),
        "bundle keeps a": similarity(mem, a),
        "cleanup recovered #%d" % int(idx[0]): float(s[0]),
    }
