"""
f02 — try strategies represented as TRIGRAM substrates, encoded vectorally, tested on the court with
CONSERVATIVE ratios; plus the news -> timeseries vector-translation probe predicting regime dynamics.

Article 0: the trigrams here are PUBLIC fixtures standing in for private `.local` IP. Offline, numpy.

    PYTHONPATH=. python3 experiments/f02_trigram_strategies/run.py
"""
import numpy as np
from foundation.backtest import synthetic
from foundation.index import trigram
from foundation.operator import trigram_strategy as ts
from foundation.regime import news_probe


def main():
    mkt = synthetic.generate(n_days=1500, seed=7)
    prices = mkt["prices"]

    print("f02 — trigram strategies (conservative, MAX_GROSS=%.2f)" % ts.MAX_GROSS)
    encoded = [trigram.encode_trigram(tg) for tg in ts.FIXTURE_TRIGRAMS]
    rows = ts.try_strategies(prices, ts.FIXTURE_TRIGRAMS, seed=1)
    for r in rows:
        # uniqueness of this trigram's IP = novelty vs the rest of the roster
        tg = r["trigram"]
        idx = ts.FIXTURE_TRIGRAMS.index(tg)
        others = [encoded[j] for j in range(len(encoded)) if j != idx]
        nov = trigram.novelty(encoded[idx], others)
        print("  [%-5s] %-46s OOS sharpe %+.2f  excess %+.2f bits  IP-uniqueness %.2f"
              % (r["verdict"], "·".join(tg), r["oos_sharpe"], r["oos_excess_bits"], nov))

    # news -> timeseries: a vector-translation probe predicting which regime a source implies
    print("\nf02 — news/frontier-source -> regime (orthogonal-Procrustes translation)")
    rng = np.random.default_rng(0)
    d, n_reg = 64, 4
    centroids = rng.normal(size=(n_reg, d))                    # the target regime space
    Q, _ = np.linalg.qr(rng.normal(size=(d, d)))               # the unknown source<->regime rotation

    def make(n):
        lab = rng.integers(0, n_reg, n)
        src = np.stack([Q.T @ centroids[l] + rng.normal(0, 0.3, d) for l in lab])
        return src, lab

    tr_src, tr_lab = make(400)
    W = news_probe.fit_translation(tr_src, centroids[tr_lab])
    te_src, te_lab = make(300)
    names = ["regime_%d" % i for i in range(n_reg)]
    acc = np.mean([news_probe.predict_regime(W, te_src[i], centroids, names)[0] == names[te_lab[i]]
                   for i in range(len(te_lab))])
    print("  translated regime-from-source accuracy: %.2f  (chance %.2f)" % (acc, 1.0 / n_reg))
    print("  -> a source embedding now maps to a regime, the regime to expected dynamics.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
