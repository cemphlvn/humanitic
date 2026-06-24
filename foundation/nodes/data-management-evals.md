# Node — Data Management & Evals (open protocols)

> **TR** — Akan girdiler, çevrimiçi eğitim, araştırma sınıfı ölçüm. AÇIK protokoller: robot için RLDS,
> piyasa için OHLC, veri kartı Croissant, köken OpenLineage, depolama Parquet; değerlendirme
> PREQUENTIAL (test-sonra-eğit). Sızıntı yok; kenar bitle, duvarın altında.
> **EN** — Streaming inputs, online training, research-grade measurement. OPEN protocols: RLDS for
> robot, OHLC for market, Croissant data cards, OpenLineage provenance, Parquet storage; evaluation is
> PREQUENTIAL (test-then-train). No leakage; edge in bits, under the wall.
> **ZH** — 流式输入、在线训练、研究级测量。开放协议：机器人用 RLDS、市场用 OHLC、数据卡 Croissant、
> 溯源 OpenLineage、存储 Parquet；评估为 prequential（先测后训）。无泄漏；以比特衡量优势，低于上限。

**Status:** ADOPTED. Code: `foundation/data/{stream,sources}.py` · `foundation/eval/prequential.py`.

## Open protocols followed
| concern | open standard | where |
|---|---|---|
| robot episodes | **RLDS** (Open-X-Embodiment) | `stream.Pair`, `sources` (`fmt=rlds`) |
| market frames | **OHLC** | `stream.Pair` (`fmt=ohlc`) |
| dataset metadata | **Croissant** (MLCommons) | `sources.Source.standard` |
| provenance / lineage | **OpenLineage** | `sources.Source.provenance` |
| storage | **Parquet / Arrow** | `sources.Source.fmt` |
| streaming evaluation | **prequential** (interleaved test-then-train; river / scikit-multiflow) | `eval/prequential.py` |

## Source allocation (research-grade)
`sources.CATALOG` holds only **open** sources (Stooq, FRED, Open-X-Embodiment, RoboTwin, DROID), each a
card with provenance, open license, and quality tier. `allocate_walkforward` splits a stream by **time**
into train/val/test; `assert_no_leakage` proves every test index falls strictly after every train index —
the future never leaks into the past.

## Measurement & evals
`prequential_eval` trains the predictor **online**: for each streaming pair it predicts the next regime
using a model fit on the strict past, scores it, then refits on the expanding past. It reports a portable,
open-shaped metrics dict — **prequential accuracy**, persistence baseline, **lift**, **skill in bits**,
and the capacity reference `C(D)`. Edge is in bits and `capacity_exceeded` flags any claim past the wall.

Article 0: it runs offline (no network in the system path); the live Stooq + Open-X-Embodiment adapters
fill the same `Pair` interface at runtime. Results stay local, in open formats, portable if you export.
