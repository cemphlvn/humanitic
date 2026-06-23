# CLAUDE.md — ark operating identity

> **TR** — Bu, `ark` üzerinde çalışan her ajanın kimliğidir. Önce Madde 0'ı oku; o tartışılamaz.
> **EN** — This is the identity of any agent working on `ark`. Read Article 0 first; it is not negotiable.
> **ZH** — 这是在 `ark` 上工作的任何智能体的身份。先读第 0 条；它不可协商。

## What ark is
**Macro Strategy OS**, powered by the **Agentic Regime Kernel**. Infrastructure people build macro
strategies on — *not* a prediction bot. We do not predict prices; we **engineer, test, repair, and
audit strategies** inside a deployment-consistent finance architecture. The one operator loop
everywhere: **state → action → feedback → revision**.

## Article 0 — the eternity clause (inviolable; never touch)
1. `.local` is hard-gitignored. 2. `.local` is unpublishable. 3. Unpublishability is ungitignorable.
4. The removal of the unpublishability clause cannot even be proposed.
Never read, write, stage, publish, or echo `.local`. Every outbound artifact routes through
`foundation/privacy/publish_guard.py`. See `foundation/constitution/00-eternity-clause.md`.

## Operating rules (every change)
- **Offline, this Mac, numpy/pandas only.** No torch, no network in the system path, no new heavy deps.
- **Not public until notice.** No push, no remotes, no GitHub. Local commits only.
- **No live trading. No live capital.** The court refuses leaky strategies; escalation
  (synthetic → paper → small live) only on explicit human approval.
- **Refutation ethos.** A refuted idea is a *result*, not a defeat. Try to break your own claims.
- **Respect the measured walls** (from `~/lib/table` LABNOTES): TC⁰ ceiling, abelian-only +
  non-abelian penalty, the `bundle` capacity envelope ("store factors not items"), seq_len≈256.
  Never claim past a wall; report it.
- **Legibility contract.** Code reads as explanation: one function = one primitive; the margin
  names the memory choreography, the kernel, and the bottleneck.
- **Trilingual bootstrap: Turkish first** (the bridge), then English, then Chinese (TR→EN→ZH).
- **Everything is tested.** Each increment builds, has an E2E gate, is one clean local commit.

## The layers (where things live)
`operator/` — agentic builder; the ordered **non-abelian** pipeline (selection→allocation→timing→risk)
and depth past TC⁰. · `kernel/` — VSA primitives + the weight-vector contract + StrategyObject.
`regime/` — FHRR regime encode (commutative) + JEPA-lite transition. · `backtest/` — the evidence
court. · `index/` — HUMANITIK local knowledge index + failure database. · `privacy/` — Article 0 guards.

## Run
```bash
PYTHONPATH=. python3 -m foundation.selftest     # the floor
PYTHONPATH=. python3 tests/run_all.py           # the suites
```

## Orchestrator way of working
Decompose → fan out parallel agents on non-colliding paths → integrate → commit. Deterministic
control flow (loops/conditionals) in the orchestrator; judgment in the agents. Verify before you
commit. Read `MASTERPLAN.md` and `PLAN.md` before large work.
