# Node — The Agent Economy (earn · pay · trade, unified)

> **TR** — Birleştirici mimari: HUMANITIK ile KAZAN, x402 ile ÖDE, broker/CDP ile İŞLE — tek döngü,
> tek ortak dil, her dış kenarda kapı.
> **EN** — The unifying architecture: EARN via HUMANITIK, PAY via x402, TRADE via broker/CDP — one
> loop, one common language, a gate at every outward edge.
> **ZH** — 统一架构：用 HUMANITIK 赚取、用 x402 支付、用 broker/CDP 交易——一个循环、一种通用语言、
> 每个对外边界都有门禁。

**Status:** ADOPTED. Code: `foundation/agent_economy.py`, `foundation/payments/x402.py`,
`foundation/execution/onchain.py`, `foundation/commons/protocol.py`. See [`UNIFYING.md`](../../UNIFYING.md).

## Build on x402
`PaymentBudget` caps an agent's per-session spend; `spend()` refuses to exceed it — a payments
circuit-breaker independent of the broker risk gate. Offline settles through `X402Meter` (deterministic,
no funds); the runtime settles real USDC (EIP-3009) on Base via `CDPFacilitator`. So an autonomous
agent can buy data/compute per-call (x402) without a human in the loop, *and* cannot drain funds.

## CDP onchain (testnet-first)
`CDPAdapter` drives a Server Wallet v2 (keys in Coinbase's TEE; the caller's API key + wallet secret
live in dot-local). `assert_trade_allowed` is the **testnet-gate**: a mainnet trade requires the
human-approved live gate. Spend Permissions add a per-period allowance independent of ark's RiskGate.

## The common language
`protocol.conforms(adapter)` — every partner (data/inference/broker/onchain/payments) has `name`,
`kind`, `describe()`. That single shape is what makes the architecture composable: the substrate and
the agent economy plug together because they speak it.
