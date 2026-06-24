# Node — The Things Network as the Sector Control

> **TR** — TTN açık-kaynak, token-SIZ, en büyük LoRaWAN ağı. ark'ta alınıp-satılan bir aday DEĞİL; LoRaWAN
> SEKTÖR faktörüdür. GEOD/HNT sinyalini ve getirisini TTN aktivitesine göre artıklaştırıp (Frisch-Waugh)
> hükmü artık üzerinde çalıştırırız: ölçülen kenar SEKTÖR betasının ÖTESİNDE.
> **EN** — TTN is the open-source, token-FREE, largest LoRaWAN network. In ark it's NOT a tradeable
> candidate; it's the LoRaWAN SECTOR factor. We residualize a GEOD/HNT signal AND return against TTN
> activity (Frisch-Waugh) and run the verdict on the residual: the measured edge is BEYOND sector beta.
> **ZH** — TTN 是开源、无代币、最大的 LoRaWAN 网络。在 ark 中它不是可交易标的，而是 LoRaWAN 行业因子。
> 把 GEOD/HNT 的信号与收益对 TTN 活动做残差化（Frisch-Waugh），在残差上出裁决：所测优势超越行业 beta。

**Status:** ADOPTED. Code: `data/adapters/ttn.py` · `eval/verdict.residualize` + `measure(..., control=)` ·
`runtime/measure.run(..., control="ttn")`. Run: `./run.sh measure --target helium --control ttn`.

## The confound it removes
GEODNET→GEOD and Helium→HNT might both be nothing but *"the LoRaWAN/IoT sector is growing."* The Things
Network is that sector growth **with no token to contaminate it** — community-run since 2015, tens of
thousands of gateways, 140+ countries. So TTN's network activity is a clean **sector factor**.

## The control (Frisch-Waugh)
```
signal_resid = signal − OLS(signal ~ TTN_activity)
return_resid = return − OLS(return ~ TTN_activity)
verdict on (signal_resid, return_resid)  ->  edge NET of LoRaWAN-sector beta
```
`verdict.measure(..., control=ttn_activity)` residualizes BOTH sides against the sector factor first. The
result: a MEANINGFUL verdict is network-SPECIFIC alpha, not the sector rising tide.

## Proven both ways (`test_sector_control`)
- A **network-specific** edge (signal independent of the sector) → MEANINGFUL, and **SURVIVES** the TTN
  control.
- A **pure-sector** edge (signal *is* the sector, return led by the sector) → looks MEANINGFUL raw, but is
  **KILLED** by the control (NOT MEANINGFUL). The apparatus tells "real edge" from "sector beta."

## Why TTN is also the easiest data
Open-source + open API + free + the largest footprint → the simplest data-integrity sprint of the three
LoRaWAN networks, and a free sector instrument. `thethingsnetwork.org` is on the egress allowlist for live.
This completes the LoRaWAN family: **GEODNET / Helium = tokenized candidates; TTN = the token-free sector
control they must beat.**
