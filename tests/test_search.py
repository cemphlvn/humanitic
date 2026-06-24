"""Graduated search algorithms: as-of binary search == two-pointer; exact cleanup + bundle wall; resonator."""
import numpy as np

from foundation.data import align
from foundation.kernel import cleanup as C
from foundation.kernel import resonator as R


def run():
    rng = np.random.default_rng(0)

    # 1) asof_searchsorted == asof_align (two-pointer), and causal
    tr = np.sort(rng.integers(0, 10**9, 3000)).astype(np.int64)
    tl = np.sort(rng.integers(0, 10**9, 400)).astype(np.int64)
    assert np.array_equal(align.asof_align(tl, tr), align.asof_searchsorted(tl, tr))
    align.assert_causal(tl, tr, align.asof_searchsorted(tl, tr))

    # 2) exact cleanup: recall under noise + the bundle-capacity wall
    D, N = 2048, 500
    cb = rng.choice([-1.0, 1.0], (N, D))
    cl = C.Cleanup(cb)
    assert cl.nearest(cb[7] + rng.normal(0, 0.8, D)) == 7
    m_max = C.bundle_capacity(D, N)

    def recall(M):
        idxs = rng.choice(N, M, replace=False)
        top = set(cl.topk(cb[idxs].sum(0), M))
        return len(top & set(idxs.tolist())) / M

    assert recall(int(m_max * 0.5)) > 0.95 and recall(int(m_max * 2.5)) < recall(int(m_max * 0.5))

    # 3) resonator factorizes a binding + the honesty flag
    Dr, F, n = 512, 3, 8
    cbs = [R.from_phase(rng.uniform(-np.pi, np.pi, (n, Dr))) for _ in range(F)]
    res = R.Resonator(cbs)
    truth = [int(rng.integers(n)) for _ in range(F)]
    c = cbs[0][truth[0]] * cbs[1][truth[1]] * cbs[2][truth[2]]
    dec, ok = res.factorize(c, seed=1)
    assert ok and dec == truth
    # a random (non-binding) vector must NOT verify -> verified=False (honesty contract)
    _, ok2 = res.factorize(R.from_phase(rng.uniform(-np.pi, np.pi, Dr)), seed=2)
    assert ok2 is False

    print("test_search: OK (asof binary==two-pointer; exact cleanup+wall M_max≈%.0f; resonator factorizes+flags)"
          % m_max)
    return True


if __name__ == "__main__":
    run()
