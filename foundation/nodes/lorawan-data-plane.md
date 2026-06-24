# Node — LoRaWAN Data-Plane ↔ ark (and the LoRaWAN DePIN family)

> **TR** — LoRaWAN veri düzlemi ark'ın mimarisinin şablonu: soldaki ADAPTÖR mantığı her veri kaynağına
> takılır, sonuç bir AI modelinde (makro-çekirdek) `w_t` üretip marketle trade eder. İki anahtar
> (NwkSkey/AppSkey) → Sybil/kimlik + gizlilik tasarımı. GEODNET ve Helium aynı LoRaWAN ailesi.
> **EN** — The LoRaWAN data plane is the template for ark's architecture: the left-side ADAPTER logic
> plugs into every data source, and the output feeds an AI model (the macro-kernel) that emits `w_t` and
> trades the market. The two keys (NwkSkey/AppSkey) → the Sybil/identity + privacy design. GEODNET and
> Helium are the same LoRaWAN family.
> **ZH** — LoRaWAN 数据平面是 ark 架构的模板：左侧适配器逻辑接入每个数据源，输出馈入 AI 模型（宏内核）
> 产生 `w_t` 并与市场交易。两把密钥（NwkSkey/AppSkey）→ 抗女巫/身份 + 隐私设计。GEODNET 与 Helium 同属
> LoRaWAN 家族。

**Status:** ADOPTED. Code: `data/adapters/{geodnet,helium}.py` · `portfolio/discovery.py` (regime·pace·
geodnet·helium) · `data/candidates.py`. From the GEODNET ION-2021 LoRaWAN architecture.

## The mapping (the diagram → ark)
| LoRaWAN data plane | ark |
|---|---|
| heterogeneous sensors (asset, gas, water, trash, vending, fire) | the **adapter plane** — every source plugs one socket: `discovery.SOURCES` / partner protocol / `candidate()` |
| Concentrator / Gateway | **ingestion** — `ingest/` normalizes heterogeneous feeds (PIT, quality, lineage) |
| Network Server (routing + integrity) | the **court** — validate/consensus before trust |
| Application Server (the AI consumer) | the **macro-kernel** — regime → portfolio → **`w_t`** → trade |
| AES-secured payload, end-to-end | the privacy boundary — only de-identified return streams cross |

Cem's read, exactly: *the left adapter logic enables plugging into every data source; the output feeds an
AI model to trade the market.* That **is** the architecture — the left isn't N sensors, it's N adapters
into one plane, which is why the same socket scales to a P2P contributor network.

## The two keys → the Sybil/identity + privacy design
LoRaWAN's dual-key model is the template for the contributor network's missing piece:
- **AppSkey** (payload encrypted end-to-end) = **Article 0**: the contributor's raw edge stays private in
  `.local`; the network only ever sees the validated return stream.
- **NwkSkey + DevAddr + MIC** (device identity + message-integrity code) = the **Sybil/stake answer**: a
  machine DID (`DevAddr`) + a signed integrity code over the submission (`MIC`) = identity + tamper-proof
  lineage. That is the trustless-verification gap, with a concrete shape.

## The LoRaWAN DePIN candidate family
LoRaWAN/LPWAN = a low-power wide-area protocol for battery IoT devices; several DePINs run it, so they
**share the data plane and the adapter shape**:
| project | token | physical-work signal → token | role |
|---|---|---|---|
| **GEODNET** | GEOD | RTCM correction throughput → 80%-rev buyback-burn | operationally ready; token weeks old |
| **Helium** | HNT | network data transfer (DC burned) → burn-and-mint | **better-POWERED first live test** (long liquid history) |

Two consequences, both real:
1. **Power** — the `PLAN.live-geodnet` power analysis needs ~2,500 hourly bars; **HNT has them today, GEOD
   won't for months** → test Helium first for the verdict, GEOD as the forward-collect.
2. **Sector beta** — the danger is that "throughput → token" is just **LoRaWAN-sector beta**. Two networks
   let the **orthogonality filter** catch it: if the GEOD and HNT edges co-move, they're one bet, not two
   (no double-counted breadth). On the synthetic fixtures they're independent (flagged); on real data the
   sector correlation is the test. `creds`: `HELIUM_API_URL` for live.
