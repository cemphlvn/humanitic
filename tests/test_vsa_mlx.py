"""
Validate the OPTIONAL MLX VSA backend against the numpy floor. Skips cleanly when MLX is absent
(so the numpy-only CI stays green); under an MLX-capable interpreter it cross-validates op-by-op.
"""
import numpy as np


def run():
    try:
        import mlx.core as mx
        from foundation.kernel import vsa_mlx as M
    except Exception as e:
        print("test_vsa_mlx: SKIP (mlx not available: %s)" % type(e).__name__)
        return True
    from foundation.kernel import vsa as N

    rng = np.random.default_rng(0)
    D = 4096

    def mk():
        t = rng.uniform(-np.pi, np.pi, D)
        n = np.exp(1j * t).astype(np.complex64)
        return n, mx.array(n)

    na, ma = mk()
    nb, mb = mk()
    nc, mc = mk()

    # bind matches numpy elementwise
    assert np.allclose(np.array(M.bind(ma, mb)), N.bind(na, nb), atol=1e-4)
    # unbind recovers the filler
    assert abs(M.similarity(M.unbind(M.bind(ma, mb), mb), ma) - 1.0) < 1e-3
    # similarity matches numpy
    assert abs(M.similarity(ma, mb) - N.similarity(na, nb)) < 1e-4
    # bundle matches numpy (up to fp)
    assert np.allclose(np.array(M.bundle([ma, mb, mc])), N.bundle([na, nb, nc]), atol=1e-3)

    # cleanup picks the SAME concept as numpy
    book_np = np.stack([np.exp(1j * rng.uniform(-np.pi, np.pi, D)).astype(np.complex64)
                        for _ in range(100)])
    noisy_np = book_np[7] * np.exp(1j * rng.normal(0, 0.5, D)).astype(np.complex64)
    i_np, _ = N.cleanup(noisy_np, book_np, 1)
    i_mx, _ = M.cleanup(mx.array(noisy_np), mx.array(book_np), 1)
    assert int(i_np[0]) == int(i_mx[0]) == 7

    # the four laws hold on MLX
    laws = M.selftest()
    assert laws["orthogonality |a.b|"] < 0.05, laws
    assert laws["bind->unbind recovers"] > 0.99, laws
    assert laws["bundle keeps a"] > 0.40, laws

    print("test_vsa_mlx: OK (MLX %s on %s — matches the numpy floor)"
          % (getattr(mx, "__version__", "?"), mx.default_device()))
    return True


if __name__ == "__main__":
    run()
