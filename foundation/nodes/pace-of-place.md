# Node — Pace of Place (embodied data → local-market prediction)

> **TR** — Kaldırım robotunun YÜRÜME HIZI, hareket DİNAMİĞİ ve GÜNÜN SAATİ, o bölgenin YEREL PİYASASININ
> öncü göstergesidir. Çekirdek varlık robot değil, gerçek-dünya VERİ AKIŞIDIR. Kenar: robot veri
> akışlarını fiyatlanan bir varlık sınıfı olmadan ÖNCE fark etmek.
> **EN** — A sidewalk robot's WALKING SPEED, motion DYNAMICS and TIME OF DAY lead that area's LOCAL
> MARKET. The core asset is not the robot — it is the real-world DATA STREAM. The edge: recognizing robot
> data streams BEFORE they become a priced asset class.
> **ZH** — 人行道机器人的步行速度、运动动态和时间会领先该区域的本地市场。核心资产不是机器人，而是真实世界
> 的数据流。优势：在机器人数据流成为定价资产类别之前识别它们。

**Status:** ADOPTED. Code: `foundation/data/adapters/frodobots.py` · `foundation/regime/pace_of_place.py`.

## FrodoBots / BitRobot — reclassified
Not robot *hardware*; **Embodied AI Data Infra** (`candidates.CLASSIFICATION['frodobots']`):
asset type = **pre-token network + dataset primitive**; tradeability = low/conditional (screening **68**);
proxy = **no clean exposure — FIL/SOL/TAO are narrative proxies only**. Common thread:
`data scarcity → gamified teleoperation → open real-world datasets → subnet verification/rewards →
embodied-AI training infra`. Watch triggers: token launch · subnet revenue · dataset licensing · major
robotics-lab usage · benchmark wins.

## The thesis (measured)
```
walking speed + dynamics + time-of-day (per area)  ->  pace signal  ->  local-market nowcast
```
`pace_features` turns FrodoBots-2K GPS into per-area-window **pace** (mean speed), **dynamics** (speed
std), and **time-of-day**. `predict_local_market` as-of aligns the pace signal to the area's local market
(causal, no lookahead), then measures lead-lag + out-of-sample forecast skill. Across Berkeley/SF/NYC
fixtures: **pace LEADS the local market by 2 windows at corr ~0.99, with forecast skill 0.53–0.66 over
persistence.**

## Honest caveat (refutation ethos)
Time-of-day is a **shared seasonal driver** of both sidewalk activity and commerce — a common cause, not
edge. The tradeable signal is the **pace ANOMALY above the time-of-day norm**; deseasonalize before any
claim. Offline the local market is a labeled demo co-moving with lagged pace; a live local-economic / token
feed drops into the same slot. The plumbing is real — the edge is recognizing the stream before it's priced.
