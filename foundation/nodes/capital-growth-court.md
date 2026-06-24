# Node — Capital Growth Court (reliable & statistically meaningful?)

> **TR** — Sistem bir SERMAYE BÜYÜME metriğini güvenilir ve İSTATİSTİKSEL OLARAK ANLAMLI biçimde tahmin
> edebilir mi? Üç bağımsız test (Newey-West t, blok bootstrap, permütasyon). Mahkeme HAYIR diyebilmeli:
> gürültüde ANLAMSIZ döner. .local'de madencilik; uygulanan arama (ikili as-of).
> **EN** — Can the system predict a CAPITAL GROWTH metric reliably and STATISTICALLY MEANINGFULLY? Three
> independent tests (Newey-West t, block bootstrap, permutation). The court must be able to say NO — it
> returns NOT MEANINGFUL on noise. Mines into .local; applied search (binary as-of).
> **ZH** — 系统能否可靠且具统计显著性地预测资本增长指标？三项独立检验（Newey-West t、块自助、置换）。
> 法庭必须能说不——对噪声返回不显著。在 .local 中挖掘；应用搜索（二分 as-of）。

**Status:** ADOPTED. Code: `foundation/eval/significance.py` · `foundation/runtime/mine.py`.

## The court
`significance.court(signal, fwd_returns)` builds the out-of-sample equity curve (position = standardized
signal, return = position · next return) and renders three independent verdicts:
- **Newey-West t-stat** on mean return (HAC, autocorrelation-robust) — needs |t| > 1.96.
- **Moving-block bootstrap** of the Sharpe — p(Sharpe ≤ 0) < α, plus a 95% CI.
- **Permutation test** — circularly shift returns to break the link, build the null, empirical p < α.

**MEANINGFUL** requires positive growth AND all three pass. The honesty contract: the *same* court must
return **NOT MEANINGFUL** on a shuffled control. Validated in `test_significance` — a planted edge →
MEANINGFUL (p≈0.001, |t|≈3); pure noise → NOT MEANINGFUL (p≈0.5). A court that can't say no is worthless.

## Run it (mines into .local)
```bash
./run.sh mine --target geodnet        # pull(replay) -> searchsorted join -> mine -> court -> .local/mined/
./run.sh mine --target geodnet --live # raises with the exact NTRIP/market setup to go live
```
Applied search: the join uses `asof_searchsorted` (causal binary as-of, ready for sparse-left live ticks).
Mined into `.local/mined/<target>.json` (Article 0 — private, 0600, gitignored): the capital-growth
verdict, the noise control, and `mined_conditionals` — P(next return regime | activity regime) as
Dirichlet sufficient stats with entropy in bits.

## The honest verdict (refutation ethos) — the court caught a confound
The standalone court detects a clean (iid) planted edge → MEANINGFUL, and rejects noise → NOT MEANINGFUL.
But on the GEODNET **replay**, something better happened: the raw throughput signal is **periodic
(diurnal)**, and its t-stat (≈3.1) and bootstrap (p≈0.001) both say "edge" — yet the **permutation test
refuses it** (p≈0.12) → **NOT MEANINGFUL**. Periodicity predicting periodicity is a **seasonal confound**,
not an edge, and the permutation catches what the naive t-stat misses. The court is stricter than a
t-stat, by design.

The lesson: a real edge must predict the **deseasonalized return residual**, not the seasonal cycle —
which is exactly what the unsupervised miner + causality test pursue (`nodes/unsupervised-edge.md`). And a
genuine verdict on GEODNET→GEOD still needs the **live feed** (NTRIP creds + a GEOD price source). The
machinery is ready and honestly skeptical; the truth needs real data.
