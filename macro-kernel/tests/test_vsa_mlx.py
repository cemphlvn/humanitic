"""
Validate the OPTIONAL MLX phase-angle VSA backend against the numpy (complex) floor, by the VSA-law
SCALARS (the two carriers differ in representation but compute the same algebra). Skips cleanly when
MLX is absent, so the numpy-only CI stays green.
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
    ta, tb, tc = (rng.uniform(-np.pi, np.pi, D) for _ in range(3))
    na, nb, nc = (np.exp(1j * t).astype(np.complex64) for t in (ta, tb, tc))      # complex carrier
    ma, mb, mc = (mx.array(t.astype(np.float32)) for t in (ta, tb, tc))           # angle carrier

    # the same VSA laws, computed two ways, must agree as SCALARS
    assert abs(M.similarity(ma, mb) - N.similarity(na, nb)) < 1e-3
    assert abs(M.similarity(M.unbind(M.bind(ma, mb), mb), ma) - 1.0) < 1e-3
    assert abs(N.similarity(N.unbind(N.bind(na, nb), nb), na) - 1.0) < 1e-3
    assert abs(M.similarity(M.bundle([ma, mb, mc]), ma)
               - N.similarity(N.bundle([na, nb, nc]), na)) < 2e-2

    # cleanup picks the SAME concept (#7) under both carriers
    tbook = rng.uniform(-np.pi, np.pi, (100, D))
    nbook = np.exp(1j * tbook).astype(np.complex64)
    eta = rng.normal(0, 0.5, D)
    i_np, _ = N.cleanup(nbook[7] * np.exp(1j * eta).astype(np.complex64), nbook, 1)
    i_mx, _ = M.cleanup(mx.array((tbook[7] + eta).astype(np.float32)),
                        mx.array(tbook.astype(np.float32)), 1)
    assert int(i_np[0]) == int(i_mx[0]) == 7

    laws = M.selftest()
    assert laws["orthogonality |a.b|"] < 0.05, laws
    assert laws["bind->unbind recovers"] > 0.99, laws
    assert laws["bundle keeps a"] > 0.40, laws

    print("test_vsa_mlx: OK (MLX %s on %s — phase-angle carrier matches the numpy floor; "
          "device-complex-trustworthy=%s)"
          % (getattr(mx, "__version__", "?"), mx.default_device(), M.gpu_complex_trustworthy()))
    return True


if __name__ == "__main__":
    run()
