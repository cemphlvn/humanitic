# Node — Ingestion Discipline (what a world-class macro builder follows)

> **TR** — Ciddi bir sistematik fonun yaptığı yutma disiplini: iki zaman damgası (geçerli/bilinen),
> madalyon (bronze/silver/gold), kalite kapıları + karantina, hayatta-kalma yanlılığı kontrolü, köken,
> nokta-anında özellik birleştirme. ark açık-veri-numpy ile yüksek-değerli %20'yi uygular.
> **EN** — The ingestion discipline a serious systematic shop runs: two timestamps (valid/known),
> medallion (bronze/silver/gold), quality gates + quarantine, survivorship control, lineage, point-in-time
> feature joins. ark implements the high-value 20% offline in numpy.
> **ZH** — 严肃系统化基金的摄取纪律：双时间戳（有效/已知）、奖牌架构、质量门+隔离、幸存者偏差控制、
> 血缘、时点特征连接。ark 用 numpy 离线实现高价值的 20%。

**Status:** ADOPTED (high-value 20%). Code: `foundation/ingest/{bitemporal,quality,universe,lineage}.py`
+ `eval/significance.deflated_sharpe` + `data/align.asof_searchsorted`. From parallel research (López de
Prado AFML; medallion/data-contracts/lakehouse canon).

## The axiom: two timestamps rule everything
Every fact has **valid time** (the period it covers) and **known time** (when it was released). Conflate
them and you get look-ahead bias — the #1 way backtests lie. Everything below follows from taking this
seriously.

## The 8 stages (and how ark approximates each)
| stage | institutional control | ark (offline) |
|---|---|---|
| 1 point-in-time | bi-temporal vintage tables, `AS OF` joins, embargo | `bitemporal.PointInTimeStore.as_of` + `align.asof_searchsorted` (causal) |
| 2 vendor onboarding | schema/data contracts, entitlement, sandbox-before-prod | `quality.SchemaContract` (executable) + the screening rubric |
| 3 medallion | bronze (immutable raw) / silver (idempotent) / gold (PIT joins) | write-once `.local` fixtures; idempotent transforms |
| 4 quality gates | schema · completeness · freshness · range · reconciliation → quarantine | `quality.gate` (quarantine with reason, never dropped) |
| 5 bias controls | survivorship, corporate actions, identifier drift, UTC | `universe.members_as_of` (survivorship) + int64-UTC timestamps |
| 6 lineage | OpenLineage/Marquez, lakeFS/DVC versioning | `lineage.manifest` (content-hashed inputs + code version) |
| 7 feature store | point-in-time feature joins, no train/serve skew | `merge_asof`-style causal joins (one code path) |
| 8 observability | freshness SLAs, access control, governance | `run.sh contain` + creds presence + health monitor |

## The high-value 20% (the difference from a hobby project)
1. **Ingest timestamp in the filename, never overwrite** — your time-machine (replay from raw).
2. **Bi-temporal columns** (`valid_from/known_from`) — correct PIT reconstruction.
3. **Causal as-of joins only** (`direction='backward'`) — no look-ahead in features.
4. **Survivorship-safe universe** (entry/exit dates) — include the names that later failed.
5. **Schema contracts as tests** — catch ~90% of vendor breaks before they corrupt history.

## The court, hardened against multiple testing
We've mined many signals — so a great-looking Sharpe may be luck. `significance.deflated_sharpe`
(López de Prado's **Deflated Sharpe Ratio**) deflates the observed Sharpe by the **expected maximum under
the null given the trial count**: the same SR that is "skilled" after 1 trial is **not** after 500. This
is the multiple-testing control that sits on top of the Newey-West / bootstrap / permutation court — the
honest answer to "is this a real edge, or did we just try enough things?"
