"""Sufficient statistics of tuples over open datasets: online covariance, Beta, Dirichlet; keyed store."""
import numpy as np

from foundation.stats import sufficient as S
from foundation.data import stream, sources


def run():
    rng = np.random.default_rng(0)

    # OnlineCovariance (Welford, streaming) matches numpy on a batch
    X = rng.normal(size=(500, 4)) @ rng.normal(size=(4, 4))
    oc = S.OnlineCovariance(4)
    for x in X:
        oc.update(x)
    assert np.allclose(oc.covariance(), np.cov(X, rowvar=False), atol=1e-6)

    # Beta posterior concentrates on the true rate, with a covering interval
    b = S.BetaPosterior()
    for _ in range(400):
        b.update(rng.random() < 0.7)
    lo, hi = b.interval()
    assert abs(b.mean() - 0.7) < 0.06 and lo < 0.7 < hi

    # Dirichlet predictive concentrates on the true categorical; entropy in bits is sane
    d = S.DirichletPosterior(3)
    true = np.array([0.6, 0.3, 0.1])
    for _ in range(900):
        d.update(rng.choice(3, p=true))
    assert np.allclose(d.predictive(), true, atol=0.05)
    assert 0 < d.entropy_bits() < np.log2(3) + 1e-9

    # TupleStatsStore over a SELECTED OPEN DATASET stream: per-regime sufficient stats
    st, L = stream.paired_replay(n=600, R=4, d=48, seed=5)
    store = S.TupleStatsStore(dim=48, K=4)
    for p in st:
        store.observe("regime:%d" % p.regime, p.state,
                      success=(p.regime == p.regime_next), next_category=p.regime_next)
    assert len(store.by_key) == 4
    params = store.params()
    assert {"cov", "beta", "dirichlet"} <= set(params[next(iter(params))])
    assert all(s.license in ("open", "public-domain") for s in sources.CATALOG)   # research-grade open

    print("test_stats: OK (online cov==numpy; Beta->%.2f; Dirichlet entropy %.2f bits; %d tuples stored)"
          % (b.mean(), d.entropy_bits(), len(store.by_key)))
    return True


if __name__ == "__main__":
    run()
