# Node — Real Adapters: Hivemapper & GEODNET → the as-of join

> **TR** — İki gerçek kaynak: Hivemapper ODC (açık dashcam API) ve GEODNET NTRIP/RTCM akışı. Canlı çekim
> ağ ister (yapılandırılmazsa açıkça hata verir); çevrimdışı zemin aynı boru hattını gerçek-şemalı
> fixture ile çalıştırır. Sonra nedensel as-of birleştirme.
> **EN** — Two real sources: Hivemapper ODC (open dashcam API) and the GEODNET NTRIP/RTCM stream. A live
> pull needs the network (and raises with setup instructions if unconfigured); the offline floor runs the
> SAME pipeline on real-schema fixtures. Then the causal as-of join.
> **ZH** — 两个真实来源：Hivemapper ODC（开放行车记录仪 API）与 GEODNET NTRIP/RTCM 流。实时拉取需要网络
> （未配置时明确报错）；离线底线用真实模式 fixture 运行同一管道。然后做因果 as-of 连接。

**Status:** ADOPTED. Code: `foundation/data/adapters/{hivemapper,geodnet}.py` · `runtime/realjoin.py`.

## Run it
```bash
./run.sh join --target geodnet           # offline floor: real-schema fixture -> causal as-of join
./run.sh join --target hivemapper        # the fastest-prototype source
./run.sh join --target geodnet --live    # live pull — raises with exactly what to configure
```

## Hivemapper (ODC, open dashcam API)
`GET /gps` → {lat, lon, alt, speed, timestamp(epoch ms), sats}; bucketed by `activity_stream` into
km-covered per window (haversine) — the physical side. Set `ODC_API_URL` to a reachable ODC device to go
live. Market side: **HONEY** burns on map-credit purchase (Solana, on-chain).

## GEODNET (NTRIP / RTCM 3.x) — the recommended first real target
`stream()` reads an NTRIP caster mountpoint; RTCM epochs (~1 Hz, **GPS-time**) → `throughput_stream`
(epochs/window) — the physical side. Set `NTRIP_CASTER` + `NTRIP_MOUNTPOINT` + `NTRIP_USER/PASS`
(client: github.com/geodnet/ntrip) to go live. Market side: **GEOD** (Coinbase-listed; ~80% rev →
buyback-burn), so station throughput aligns to GEOD price / on-chain revenue.

## The join (causal, no lookahead)
`realjoin` runs `align.asof_align` (backward as-of) + `assert_causal` over the two clocks, then a
`lead_lag` read (does physical activity LEAD the market?). The aligned tuples then feed `regime/atoms`
(mine robot↔market atoms) → `eval/prequential` (edge in bits) → `stats/sufficient` (cov · Beta ·
Dirichlet). Offline the market series is a labeled demo co-moving with lagged activity; a live price feed
(CoinGecko/DefiLlama/RPC) drops into the same slot.
