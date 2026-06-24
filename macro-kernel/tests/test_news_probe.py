"""news_probe: the orthogonal-Procrustes vector translation recovers regime from a source embedding."""
import numpy as np
from foundation.regime import news_probe


def run():
    rng = np.random.default_rng(0)
    d, n_reg = 64, 4
    centroids = rng.normal(size=(n_reg, d))
    Q, _ = np.linalg.qr(rng.normal(size=(d, d)))               # true source->regime rotation

    def make(n):
        lab = rng.integers(0, n_reg, n)
        src = np.stack([Q.T @ centroids[l] + rng.normal(0, 0.3, d) for l in lab])
        return src, lab

    tr_src, tr_lab = make(400)
    W = news_probe.fit_translation(tr_src, centroids[tr_lab])

    te_src, te_lab = make(200)
    names = ["r%d" % i for i in range(n_reg)]
    acc = float(np.mean([news_probe.predict_regime(W, te_src[i], centroids, names)[0] == names[te_lab[i]]
                         for i in range(len(te_lab))]))
    assert acc > 0.6, acc                                      # well above chance 0.25

    # W is (near-)orthogonal: WᵀW ≈ I
    err = np.linalg.norm(W.T @ W - np.eye(W.shape[1]))
    assert err < 1e-6, err
    print("test_news_probe: OK (regime-from-source acc=%.2f, orthogonality err=%.1e)" % (acc, err))
    return True


if __name__ == "__main__":
    run()
