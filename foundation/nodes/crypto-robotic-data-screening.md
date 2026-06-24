# Node — Crypto × Robotic-Data Screening (which projects, by which questions)

> **TR** — Hangi kripto projeleri hizalanabilir robotik akış verisine sahip? Onları HANGİ SORULARLA
> tanırız? 7 boyutlu eleme rubriği (çalıştırılabilir) + araştırmadan aday sıralaması. Çürütme duruşu:
> kanıt geçene dek elenmiş say.
> **EN** — Which crypto projects own alignable robotic stream data, and by WHICH QUESTIONS we identify
> them. A runnable 7-dimension screening rubric + a researched candidate ranking. Refutation posture:
> assume disqualified until evidence passes.
> **ZH** — 哪些加密项目拥有可对齐的机器人流数据，以及用哪些问题识别它们。可运行的 7 维筛选规则 +
> 研究得出的候选排名。反驳姿态：证据通过前先假定淘汰。

**Status:** ADOPTED. Code: `foundation/data/screening.py` (questions) · `foundation/data/candidates.py`
(scored targets). From two parallel research agents (June 2026).

## The identifying questions (7 weighted dimensions, 22 questions)
| dim | wt | the gate |
|---|---|---|
| streaming & timestamps | 20% | GPS/NTP clock, not a block-timestamp at ingestion; bounded jitter |
| verifiability | 20% | cryptographic provenance (machine DID / HSM / proof-of-physical-work) |
| data modality | 15% | named hardware, a rich frame (≥5 physical quantities), continuous |
| market linkage | 15% | liquid token (ADV >$500K) + a *falsifiable* physical-work → on-chain mechanism |
| alignment feasibility | 15% | shared UTC clock, compatible rate, on-chain-linkable event logs, no insider-preview |
| access & openness | 10% | raw data content-addressed (CID on-chain) vs a rewritable gated API |
| legal & ethical | 5% | PII in telemetry, ToS on commercial/derivative use, jurisdiction |

**Automatic disqualifiers (score → 0):** block-timestamp-only · no provenance · illiquid token · an
insider-preview window (a domain-specific look-ahead: insiders seeing telemetry before on-chain commitment
*reverse the causal arrow*). The field is heavily left-skewed — most "robot data" is fabricated telemetry
or a centralized DB posting aggregates on-chain. Clearing all four common failures is already top-few-%.

## The candidates, scored *through* the rubric (`candidates.ranked()`)
| target | token | alignability | rubric verdict | why |
|---|---|---|---|---|
| **GEODNET** | GEOD | **YES** | **STRONG (81)** | RTCM 1s GPS-time epochs; GEOD Coinbase-listed, 80% rev→burn — station throughput on-chain joins to GEOD/USD |
| **Hivemapper** | HONEY | PARTIAL | CONDITIONAL (79) | GPS+4K video timestamped; HONEY burns on map purchase are on-chain; fastest prototype |
| **peaq** | PEAQ | PARTIAL | CONDITIONAL (75) | Universal Machine Time (ns PTP on-chain) is the perfect join clock; telemetry is per-app |
| **FrodoBots/BitRobot** | none yet | PARTIAL | CONDITIONAL (68) | richest *open* robot stream (GPS@1Hz/IMU@100Hz/video, CC-BY-SA); token not launched → proxy |
| **XMAQUINA** | DEUS | NO | **DISQUALIFIED (0)** | no provenance — an equity-tokenization DAO; "telemetry oracle" is roadmap language |

Full catalog (15, incl. Robonomics, NATIX, OpenMind/ROBO, RICE, Auki, Tashi, CodecFlow) in
`candidates.CANDIDATES`. `[UNCERTAIN]` flags mark unverified claims — re-check before scoping.

## How it plugs in
A passing project feeds the rest of the stack: its timestamped robot stream + crypto dynamics →
`data/align.asof_align` (causal as-of) → `regime/atoms` (mine robot↔market atoms) →
`eval/prequential` (measure edge in bits) → `stats/sufficient` (store the covariances/Betas/Dirichlets).
GEODNET is the recommended first target; Hivemapper the fastest prototype.
