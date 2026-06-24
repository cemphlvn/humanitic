"""cross_seam: the ensemble of aligned topologies beats the average single model; seam sizes position."""
import numpy as np
from foundation.regime import cross_seam, news_probe


def run():
    rng = np.random.default_rng(0)
    d, R, M = 48, 4, 9
    centroids = rng.normal(size=(R, d))
    Qs = [np.linalg.qr(rng.normal(size=(d, d)))[0] for _ in range(M)]      # M native topologies
    noise = [5.0 for _ in range(M)]                  # noise ~ centroid separation -> single topologies err

    def emb(model, regime):
        return Qs[model].T @ centroids[regime] + rng.normal(0, noise[model], d)

    # align each model topology to the shared regime space
    n_tr = 400
    labs = rng.integers(0, R, n_tr)
    sources = [np.stack([emb(m, labs[i]) for i in range(n_tr)]) for m in range(M)]
    Ws = cross_seam.align_models(sources, centroids[labs])
    names = ["r%d" % i for i in range(R)]

    # held-out: consensus vs single-model accuracy
    n_te = 200
    te = rng.integers(0, R, n_te)
    cons_hits = 0
    single = np.zeros(M)
    for i in range(n_te):
        embs = [emb(m, te[i]) for m in range(M)]
        cross = cross_seam.cross_predict(Ws, embs, centroids, names)
        cons_hits += (cross["consensus"] == names[te[i]])
        for m in range(M):
            single[m] += (news_probe.predict_regime(Ws[m], embs[m], centroids, names)[0] == names[te[i]])
    cons_acc = cons_hits / n_te
    single /= n_te
    # the core-seam ensemble beats the average single topology
    assert cons_acc >= single.mean() + 0.02, (cons_acc, single.mean())

    # seam sizes the position: full agreement -> full size; wide seam -> shrunk
    full = cross_seam.seam_signal({"consensus": "r0", "agreement": 1.0, "divergence": 0.0},
                                  {"r0": 1.0}, max_gross=0.25)
    half = cross_seam.seam_signal({"consensus": "r0", "agreement": 0.5, "divergence": 0.5},
                                  {"r0": 1.0}, max_gross=0.25)
    assert abs(full - 0.25) < 1e-9 and abs(half - 0.125) < 1e-9

    print("test_cross_seam: OK (consensus %.2f vs single mean %.2f / best %.2f)"
          % (cons_acc, single.mean(), single.max()))
    return True


if __name__ == "__main__":
    run()
