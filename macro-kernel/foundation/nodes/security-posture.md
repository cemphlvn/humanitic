# Node — Security Posture of the Novel Additions

> **TR** — Yeni eklentiler (x402 ödemeleri, CDP zincir-üstü, ajan ekonomisi, ortak kaydı) saldırı
> yüzeyini genişletir. Her dış kenar bir kapıyla korunur; `security_posture` bu kapıların varlığını
> doğrular (gerilemeyi yakalar).
> **EN** — The novel additions (x402 payments, CDP onchain, the agent economy, the partner register)
> widen the attack surface. Every outward edge is gated; `security_posture` asserts the gates exist
> (catches a regression that quietly removes one).
> **ZH** — 新增功能（x402 支付、CDP 链上、智能体经济、合作伙伴注册）扩大了攻击面。每个对外边界都设门禁；
> `security_posture` 断言这些门禁存在（捕捉悄悄移除门禁的回归）。

**Status:** ADOPTED. Code: `foundation/security/audit.py`. Health metric: `security_posture`.

## Threat model — addition → surface → defense
| novel addition | new attack surface | defense (in code) |
|---|---|---|
| **x402 payments** | budget drain; a single large payment; runaway loop spending | `PaymentBudget` session cap **+ `max_single` per-payment cap**; rogue/looping agent can't drain |
| **CDP onchain** | mainnet funds at risk; key theft | **testnet-gate** (mainnet needs the live token); Server-Wallet keys in Coinbase TEE; API/wallet secret in dot-local, never shared temp, never published |
| **agent economy** (autonomous financial actor) | the agent acts in markets unsupervised | critic admission + risk stack + **drawdown KILL** + **live token** + dead-man heartbeat |
| **partner register / adapters** | a malicious/unlicensed partner | **ethical gate** (no register without a HUMANITIK license); `adapter` is a *string path*, never imported/executed (no RCE) |
| **personal OS / dot-local** | private keys & IP leaking | Article 0 publish_guard (blocks `.local` and `*.local`); secure scratch (0700, per-agent, symlink-refusing, no private data in shared temp) |
| **CDP Spend Permissions** | (defense in depth) | a per-period onchain allowance **independent of ark's RiskGate** — two gates, not one |

## The posture self-check
`security_posture()` exercises each gate (over-budget refused, mainnet refused, publish_guard blocks
`.local`/`*.local`, secure_temp refuses private paths, ethical gate refuses an unlicensed partner) and
returns **SECURE** only if all hold. It is wired as the `security_posture` health metric and the
`test_security` suite — so removing a gate turns the health red and fails CI. This is Article 0.3's
spirit generalized: **the guards cannot be silently removed.**

## Residual risks (named, not hidden)
- The runtime LLM/agent is an injection surface (file-based prompt injection) — mitigated by per-agent
  secure scratch, but the operator must still sanitize tool outputs before re-prompting.
- x402/CDP settlement trusts the facilitator/chain — testnet-first + small-notional escalation bound it.
- These are gated, but live capital remains a human decision — by design.
