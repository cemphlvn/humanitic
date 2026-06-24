# Node — Discovery & the Contributor Network (P2P, reward-carrying)

> **TR** — `candidate()` artık tek sentetik üreteç değil; ÇOKLU gerçek bulucu (regime · pace · geodnet).
> Üstünde ödül taşıyan P2P seam: katkıcı getiri akışı + köken gönderir (ham IP `.local`'te kalır), ağ-
> geneli n_trials ile mahkeme + diklik kabul eder, ödeme = DSR × yenilik, HUMANITIK 95/5.
> **EN** — `candidate()` is no longer one synthetic generator; it's MANY real finders (regime · pace ·
> geodnet). On top sits the reward-carrying P2P seam: a contributor submits a return stream + lineage
> (raw IP stays in `.local`), the court (network-wide n_trials) + orthogonality admit, payout = DSR ×
> novelty, split HUMANITIK 95/5.
> **ZH** — `candidate()` 不再是单一合成生成器，而是多个真实发现器（regime·pace·geodnet）。其上是带奖励
> 的 P2P 接口：贡献者提交收益流 + 溯源（原始 IP 留在 `.local`），法庭（全网 n_trials）+ 正交性准入，
> 报酬 = DSR × 新颖度，按 HUMANITIK 95/5 分配。

**Status:** ADOPTED. Code: `foundation/portfolio/discovery.py` · `foundation/commons/contributor.py` ·
`foundation/runtime/contribute.py`. Run: `./run.sh contribute`.

## Discovery — the real edge-finders feeding the book
`discovery.SOURCES = {regime, pace, geodnet}` — three *different reads of the world* (a hidden-state
regime edge, an embodied walking-pace edge, a DePIN throughput edge). Different finders are orthogonal by
construction, not by luck, so re-seeding one generator is replaced by genuinely cross-source candidates.
Measured: the book admits **all three sources** (`sources_admitted = [geodnet, pace, regime]`),
`diversified_ir 0.46`. A live feed (NTRIP / FrodoBots / market) drops into `discovery.SOURCES` unchanged.

## The contributor protocol (reward-carrying P2P)
A node submits `(returns, lineage)` — **never the raw strategy** (Article 0: the secret sauce stays in its
private `.local`; the network sees only realized P&L + provenance, enough to *judge and price*, nothing
more). Then:
1. **Court** — Deflated Sharpe with **network-wide `n_trials`** (the crowd IS the multiple-testing count;
   1000 lucky coin-flippers can't crown one) and **empirical `sr_variance`** (the trial-Sharpe dispersion).
2. **Orthogonality** — admit only edges that add new direction (a copy scores ~0 novelty → rejected).
3. **Reward** — `gross = pool · DSR × novelty`, split **HUMANITIK 95/5**. A copy earns ~0; a weak edge
   fails the court; decay stops the reward (the monitor retires it).
`./run.sh contribute` runs a demo round; settlement (x402 / CDP, testnet-gated) is the **agent economy's**
job, not done here.

## What this answers — does it need adapters + P2P + reward?
The `candidate()` seam means the system is adapter-based: one local discoverer generalizes to **many
contributors** without a rewrite. P2P+reward isn't required to *work* (single-node is fine, and is where
you start) — it's the **scaling path for novelty-breadth**, and its incentives self-align: novelty pays,
copies don't. The binding requirement isn't the adapters; it's **trustless verification** — the court +
Deflated-Sharpe + ingestion-lineage turned into consensus rules, plus the one missing piece, **Sybil/stake
resistance** (the DePIN verifiability gap). The whole stack converges: **portfolio-of-edges + HUMANITIK +
agent-economy + DePIN-verification = one object** — a verifiable, privacy-preserving, reward-carrying
network for orthogonal alpha. The macro-kernel is the node; HUMANITIK is the protocol.
