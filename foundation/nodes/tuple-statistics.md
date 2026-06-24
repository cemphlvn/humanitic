# Node — Tuple Statistics (covariances · Betas · Dirichlets)

> **TR** — Açık veri kümelerinde analiz edilen demetlerin YETERLİ İSTATİSTİKLERİ: kovaryanslar, Beta'lar,
> Dirichlet'ler. Eşlenik, çevrimiçi güncellenebilir, küçük ve taşınabilir. Yalnız parametreler çıkar;
> ham veri çıkmaz (Madde 0).
> **EN** — The SUFFICIENT STATISTICS of tuples analyzed over open datasets: covariances, Beta's,
> Dirichlets. Conjugate, online-updatable, small and portable. Only parameters leave; raw data does not
> (Article 0).
> **ZH** — 在开放数据集上分析的元组的充分统计量：协方差、Beta、Dirichlet。共轭、可在线更新、小而便携。
> 只有参数离开；原始数据不会（第 0 条）。

**Status:** ADOPTED. Code: `foundation/stats/sufficient.py`.

## What we store (and why it's enough)
For each tuple/atom analyzed over the selected open datasets we keep three **conjugate sufficient
statistics** — they summarize the tuple's behavior without retaining a single raw sample:

| statistic | distribution | conjugate to | answers |
|---|---|---|---|
| `OnlineCovariance` | — (Welford mean+cov) | — | how the tuple's features co-vary |
| `BetaPosterior` | Beta(a,b) | Bernoulli | did the correspondence hold? (rate + credible interval) |
| `DirichletPosterior` | Dir(α) | Categorical | distribution over the NEXT regime (+ entropy in bits) |

`TupleStatsStore` keys one `TupleStats` per tuple and updates them in a single online pass over a stream
(`test_stats` updates per-regime stats from a paired open-dataset stream). `save(path)` writes **only the
parameters** (0600); the runtime persists them to `.local` (private IP). The raw tuples never leave —
sufficiency *is* the privacy guarantee, and `DirichletPosterior.entropy_bits()` ties the stored uncertainty
straight back to the project's edge-in-bits accounting.
