# Node — Portfolio of Edges (the architecture, realized)

> **TR** — Tek-cümle hedefin mimarisi: çok sayıda küçük, BAĞIMSIZ, dürüstlük-onaylı kenarın kitabı.
> Keşfet → mahkeme → dik-likse kabul (kapasite-sınırlı) → tahsis (risk-paritesi) → bozulanı emekli et.
> Çıktı: kitap + ağırlık vektörü + çeşitlendirilmiş IR. Dürüstlük-kapılı, hayatta-kalma-tabanlı.
> **EN** — The architecture of the one-sentence target: a BOOK of many small, INDEPENDENT, honesty-
> validated edges. Discover → court → admit-if-orthogonal (capacity-bounded) → allocate (risk-parity) →
> retire decayed. Output: the book + weight vector + diversified IR. Honesty-gated, survival-floored.
> **ZH** — 一句话目标的架构：许多小的、独立的、经诚实验证的优势组成的账本。发现 → 法庭 → 正交则纳入
> （容量受限）→ 配置（风险平价）→ 退役衰减者。输出：账本 + 权重向量 + 分散化 IR。

**Status:** ADOPTED. Code: `foundation/portfolio/{edge_book,orthogonality,allocator,monitor,loop}.py`.
Run: `./run.sh book`. Built by the orchestrator + three parallel subagents on the frozen `EdgeBook` contract.

## The loop
```
discover (novel sources) ─► VALIDATE (court: Deflated Sharpe, n_trials = all candidates) ─► honesty gate
   ─► ADMIT iff orthogonal (corr<τ; capacity-bounded displacement) ─► breadth currency
   ─► RETIRE decayed / redundant (monitor) ─► allocate (risk-parity / frac-Kelly) ─► w_t
```

## Components (all green)
| module | role | key call |
|---|---|---|
| `edge_book` | the persistent book + correlation matrix (the breadth currency) | `EdgeBook.correlation()` |
| `orthogonality` | admit only uncorrelated edges; displace the weakest when full | `admit(book, edge, tau)` |
| `allocator` | combine orthogonal edges → weights; diversified IR | `weights()` · `diversified_ir()` |
| `monitor` | retire decayed (rolling DSR) / redundant edges | `review()` · `apply()` |
| `loop` | discover → court → admit → retire → allocate | `build_book()` |

## The objective it maximizes
```
IR_book ≈ √(Σ DSR_i²),  admit i iff  DSR_i > 0.95  AND  maxⱼ corr(i,j) < τ,  s.t. drawdown < D_max
marginal value of a candidate = DSR × (1 − corr_to_book)   ← the cultural-cartographer reward
```
Not hit rate, not single-strategy Sharpe — **uncorrelated alpha × novelty-breadth.**

## Measured (synthetic candidates, flagged)
`./run.sh book` over 10 candidates: the **court rejected 7** (multiple-testing haircut, n_trials=10), the
**3 orthogonal survivors** were admitted (novelty ≈ 1.0), risk-parity weighted ~equally, and
`diversified_ir 0.365 > portfolio_sharpe 0.351` — breadth realized. The honesty gate doing its job is the
point: most candidates *should* die.

## The capacity ceiling (pure ark)
The book is **capacity-bounded** by the bundle wall `C(D)=0.386·D`: only so many orthogonal edges fit
before cleanup fails, so a full book admits a new edge only by displacing the weakest `DSR×novelty`
incumbent. The conservation law is the governor on breadth — it forces quality.

## Honest framing
Candidates are synthetic regime edges (planted) — this validates the **portfolio machinery**, not a live
book. A live discovery feed (atoms / pace / DePIN, via the live pull) drops into `loop.candidate()`
unchanged; the book persists to `.local/edges/` (private). Survival floor (drawdown KILL, paper-only) and
honesty gate (the court) wrap it as constraints, not objectives.
