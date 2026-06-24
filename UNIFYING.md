# UNIFYING — the rethought architecture (substrate ⊕ agent economy)

> **TR** — İki yarıyı tek mimaride birleştir: strateji ZEMİNİ (rejim → strateji → backtest) ve AJAN
> EKONOMİSİ (HUMANITIK ile kazan, x402 ile öde, broker/CDP ile işle). Tek ortak dil, tek döngü.
> **EN** — Merge both halves under one architecture: the strategy SUBSTRATE (regime → strategy →
> backtest) and the AGENT ECONOMY (earn via HUMANITIK, pay via x402, trade via broker/CDP). One
> common language, one loop.
> **ZH** — 在单一架构下合并两半：策略底座（机制→策略→回测）与智能体经济（用 HUMANITIK 赚取、用
> x402 支付、用 broker/CDP 交易）。一种通用语言，一个循环。

This is the *rethink*: not a rewrite of the green substrate (that would be reckless — 23 suites, 24
commits), but an **additive reorganization** around what x402 + CDP + Coinbase-for-Agents imply — ark
as an **agent-economy substrate**.

## The unified loop
```
            ┌──────────────── COMMON ADAPTER LANGUAGE (commons/protocol.py) ────────────────┐
            │  every partner — data · inference · broker · onchain · payments — one schema   │
            └───────────────────────────────────────────────────────────────────────────────┘
PersonalOS (.local, per individual)
   regime kernel (VSA/MLX) → operator (agentic) → strategy genome (trigram)
        │
   EARN ──HUMANITIK──▶  de-identified contribution → 95% cartographer / 5% foundation
        │
   PAY  ──x402──▶       per-call for data/compute, HARD-CAPPED by the session budget
        │
   TRADE ──▶            paper (default) · broker partner · CDP onchain
        │                  gates: critic admission · risk stack · drawdown KILL ·
        │                         live token (fiat) · CDP testnet-gate (onchain)
   CALIBRATE ──▶        private post-trade memory (.local)
```

## The two halves, merged
| substrate (what to trade) | agent economy (how it acts in the world) |
|---|---|
| `regime/` · `operator/` · `backtest/` · `spine/` | `payments/x402.py` · `execution/onchain.py` (CDP) · `commons/` (HUMANITIK) |
| edge in bits, capacity wall, refutation ethos | earn / pay / trade, budget + testnet + live gates |
`agent_economy.AgentEconomy` binds them; `commons/protocol.py` is the language they share.

## The gates (nothing reaches the world ungated)
- **x402 budget** — spend can never exceed the per-session cap (rogue/looping agent can't drain funds).
- **CDP testnet-gate** — a mainnet onchain trade needs the human-approved live gate; testnet-first.
- **Live token** — fiat live capital needs `LIVE_APPROVAL_TOKEN`.
- **Article 0** — wallet/API secrets and `.local` never enter shared temp and never publish.
- **Spend Permissions** (CDP) — a per-period onchain allowance, independent of ark's RiskGate.

The substrate engineers and proves strategies; the agent economy lets a sovereign per-person OS earn,
pay, and trade them — composably, honestly, and gated at every outward edge.
