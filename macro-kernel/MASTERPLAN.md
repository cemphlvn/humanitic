# MASTERPLAN — ark · the Macro Strategy OS

> Strategy, not implementation. **PLAN.md** holds the arc-by-arc build and the E2E gates (the f01
> ethical-backtest experiment); this file holds the *why*, the category lock, the moat, and the
> roadmap that PLAN.md executes. Read them together: this is the map, PLAN.md is the route.
>
> **Not public until notice.** Local-only. No push, no remote, no live capital. Offline, numpy-only.

---

## 1. Vision (TR → EN → ZH)

> **TR** — `ark`, makro stratejileri *ifade etmek, sınamak, zorlamak, dağıtmak ve revize etmek* için
> programlanabilir bir zemindir; bir **Ajan-Rejim Çekirdeği** ile çalışır. Modele fiyat sordurmuyoruz;
> dağıtımla tutarlı bir finans mimarisinin içinde stratejileri **mühendislik, test, onarım ve
> denetimden** geçirmesini istiyoruz. Çürütülen bir fikir bir yenilgi değil, bir sonuçtur — ve bu
> refüatasyon etiği ürünleşince hendeğimiz olur. *(Türkçe önce: İngilizce ile Çince arasındaki köprü.)*
>
> **EN** — `ark` is a programmable substrate to *express, test, stress, deploy, and revise* macro
> strategies, powered by an **Agentic Regime Kernel**. We do not ask the model to predict prices; we
> ask it to **engineer, test, repair, and audit** strategies inside a deployment-consistent finance
> architecture. A refuted idea is a result, not a defeat — and that refutation ethos, productized,
> is the moat.
>
> **ZH** — `ark` 是一个可编程底座，用于*表达、回测、压力测试、部署与修正*宏观策略，由**智能体式市场机制内核**
> （Agentic Regime Kernel）驱动。我们不让模型预测价格；我们让它在一个与部署一致的金融架构内
> **构建、测试、修复与审计**策略。一个被驳倒的想法是成果而非失败——把这种反驳精神产品化，就是我们的护城河。

---

## 2. The category lock

> **TR** — Bu bir "yapay zekâ alım-satım botu" **değildir**. Bu, insanların üzerine makro strateji inşa
> ettiği bir altyapıdır. **EN** — Not an "AI trading bot." Infrastructure people build macro strategies
> on. **ZH** — 不是"AI 交易机器人"，而是人们在其上构建宏观策略的基础设施。

The single most important sentence: **ark is INFRASTRUCTURE, not a predictor.** A trading bot answers
"what will the price do?" — a question that invites overfitting, look-ahead leakage, and silent
survivorship lies. ark answers a different question: *"given a macro thesis, can we engineer a
strategy object, prove it survives an honest court, and remember exactly how it died if it doesn't?"*

| | AI trading bot | **ark — Macro Strategy OS** |
|---|---|---|
| Asks the model to | predict prices | engineer · test · repair · audit |
| Primitive | a trade / a signal | a **StrategyObject** (tested, revisable) |
| Success metric | return (PnL) | **honesty** — leakage caught, costs charged, OOS clean |
| Failure | hidden, discarded | **filed as an autopsy** (the moat) |
| Output | an order | `w_t`, a deployment-consistent weight vector |
| What it leaves behind | a track record | a **failure database + attribution ledger** |

The category lock is defensive: it removes the one promise (price prediction) we can't keep honestly,
and replaces it with one we can — a deployment-consistent place to build, falsify, and remember.

---

## 3. The five layers (each grounded in a lineage wall)

The architecture is a deliberate division of labor forced by **measured constraints** from the
author's gen-1→gen-5 cognitive-architecture LABNOTES. The regime substrate *is* that lineage's FHRR
torus kernel; the walls are not metaphors, they are numbers, and the layering is how we route around
them.

### Layer 1 — Operator (the builder/operator; GLM-style agentic engineering)
Runs the loop. Supplies the two things the substrate provably cannot:
- **Compositional DEPTH past the TC⁰ ceiling.** Merrill et al.: a fixed-depth attention/VSA pass
  cannot do unbounded sequential composition in one shot. So the operator loop supplies depth
  *externally*, by iterating state→action→feedback→revision.
- **The ordered NON-ABELIAN pipeline** `selection → allocation → timing → risk`. Order matters; this
  composition does not commute. Per the abelian-only penalty (a 0.3–0.6 tax on S₃/A₄/S₄/A₅), the
  substrate is *taxed* on non-commutative composition — so the ordered pipeline lives **here**, in
  `StrategyObject.target_weight`, never inside the VSA. (See `foundation/kernel/strategy_object.py`.)

### Layer 2 — Regime (HD/VSA FHRR torus kernel + JEPA-lite transition predictor)
Encodes *"what regime are we in"* as a **commutative/abelian bag** of bound `feature:level` pairs.
Five primitives, written to be read (`foundation/kernel/vsa.py`): `bind` (phases add → commutative),
`bundle` (superpose a set), `permute` (protect order), `similarity` (cosine search), `cleanup` (snap
to codebook). A numpy **JEPA-lite** predicts the *next regime* (transition), not price.
- **Wall — the capacity envelope.** D=128 is reliable to ~vocab=24 at depth=10; past that, `bundle`
  crosstalk crashes recall. Rule: **store factors, not items — and report the wall** where it breaks.
- **Wall — seq_len≈256.** A universal training wall; the regime layer respects it by design.

### Layer 3 — Execution (FinRL-X weight-vector contract)
Everything terminates in a target weight `w_t` (`foundation/kernel/contracts.py`). Upstream logic can
change freely; **this contract cannot.** It is the stable interface that makes the rest swappable —
synthetic market today, point-in-time real OHLCV later, *behind the same contract*, so experiments
re-run unchanged. `validate_weights` rejects non-finite and over-leveraged vectors at the boundary.

### Layer 4 — Commons (HUMANITIK: index + failure database + attribution)
A **local** knowledge index, a **failure database** (autopsies: why strategies died, where backtests
lied, which regimes broke them), and a **contribution attribution & reward** ledger. This is the moat
(Section 5). De-identified lessons only — never a `.local` position.

### Layer 5 — Privacy (`.local`, governed by Article 0 — the eternity clause)
The one invariant a self-revising system may not touch — the **privacy spine and alignment anchor**:
(1) `.local` hard-gitignored, (2) unpublishable, (3) unpublishability ungitignorable, (4) its removal
**cannot even be proposed.** RATIFIED · non-amendable · non-proposable. Enforced in code
(`foundation/privacy/publish_guard.py`) with a meta-test that guards the guard — not by trust.

---

## 4. The operator loop + the atomic primitive

> **TR** — Ortak döngü: durum → eylem → geri-besleme → revizyon. **EN** — The common loop:
> state → action → feedback → revision. **ZH** — 通用循环：状态 → 动作 → 反馈 → 修正。

```
  thesis ──▶ compile StrategyObject ──▶ run the court ──▶ read the autopsy ──▶ revise ──┐
     ▲                                  (walk-forward,                                  │
     └──────────────────────────────────  costs, leakage-guard) ◀──────────────────────┘
```

The loop is deterministic first (no LLM required); the LLM-driven operator is an upgrade of the same
loop, not a different system. The atomic primitive it produces and revises:

```
StrategyObject = {
  thesis, data_sources, regime_assumptions,
  selection, allocation, timing, risk,   ← the ordered non-abelian pipeline (operator layer)
  validation_results,                    ← the court's verdict (OOS, costs, leakage)
  execution_adapter,                     ← terminates in w_t (the contract)
  post_trade_memory                      ← what we learned (feeds the commons)
}
```

It is **not a trade** — it is a tested, revisable object whose execution face is the weight-vector
contract and whose memory feeds the failure database. The loop *is* how depth is supplied past the
TC⁰ ceiling: each revision is one more layer of composition the single pass could not do alone.

---

## 5. The moat — the failure database

> **TR** — Çürütülen bir fikir bir yenilgi değil, bir sonuçtur. **EN** — A refuted idea is a result,
> not a defeat. **ZH** — 一个被驳倒的想法是成果，而非失败。

Everyone keeps the winners. **The moat is keeping the losers — with autopsies.** ark remembers *why*
strategies died, *where* backtests lied, and *which* regimes broke them. This is the lab's refutation
ethos productized: every variant tested is logged (defeating multiple-testing self-deception — no
silent discards), and a dead strategy produces a *filed autopsy*, not a deleted branch.

Why it compounds: a price predictor's edge decays as the world copies it; a **failure database** grows
monotonically and is *adversarial to overfitting by construction*. The longer ark runs, the more
honest it gets — the opposite of a backtest that flatters itself. Attribution makes it a commons: the
strongest objection wins, and the person who brought it is credited in the ledger.

---

## 6. The Zhipu movement-vector thread + the quant-physics bridge

> **TR** — Operatör katmanı *trader değil*, sistemi kuran ajandır. **EN** — The operator layer is the
> system *builder*, not the trader. **ZH** — 操作者层是系统的*构建者*，而非交易员。

**The movement vector** (Zhipu/GLM lineage): chat → reasoning/coding → **agentic engineering** →
long-horizon autonomous systems (GLM-4.5 ARC → GLM-5/5.1/5.2). ark's operator layer sits at the
*agentic-engineering* point on that vector: the agent that **builds, tests, and repairs** strategies.
This is the deliberate bet — we ride the curve that is actually improving (autonomous engineering),
not the curve that is not (price prediction).

**The quant-physics bridge** makes the layering provable rather than stylistic:

```
   w_t = Measure( Ô_risk · Ô_timing · Ô_allocation · Ô_selection · |M_t⟩ )
```

`|M_t⟩` is the **regime state** (the abelian VSA bag — commutative, layer 2). The operator chain
`Ô_risk · … · Ô_selection` is **non-commutative**: swap two operators and you get a different `w_t`.
That non-commutativity is exactly the abelian-only penalty the substrate is taxed on — so the chain
**must** live in the operator layer (layer 1), and `Measure(·)` is the collapse onto the weight-vector
contract (layer 3). The math forces the architecture: commutative description in the kernel, ordered
composition in the operator, stable collapse at the contract. Layers 1/2/3 are not a choice; they are
the only honest factorization.

---

## 7. The 5-arc roadmap (HUMANITIK SMART goals + KPI dashboard)

PLAN.md owns the per-arc build and E2E tests; this is the strategic shape and the measurable bars.
Each arc closes against the **HUMANITIK** invariants (H Honest evidence · U User-owned privacy ·
M Measured limits · A Attribution · N Nodes open · I Indexed locally · T Trilingual · I Iterative
operator · K Kernel-legible) — each with a number, not an adjective.

| Arc | Theme | HUMANITIK SMART goal (measurable bar) |
|---|---|---|
| **0 ✅ DONE** | Readable floor + eternity clause | **K/U**: VSA `bind→unbind = +1.000`; OOS Sharpe finite; `clean leak=False / leaky leak=True`; `.local publishable=False`. Green via `foundation.selftest` + `tests/run_all.py`. |
| **1** | Harden the evidence court | **H/M**: purged/embargoed folds with **zero** train/test overlap; injected leak collapses OOS Sharpe **≥ 50%** vs IS; cost model shifts a zero-cost backtest by **exactly** the modeled bps. |
| **2** | Regime layer (VSA + JEPA-lite) | **M/K**: held-out 4-regime classification **≥ 70%** (chance 25%); JEPA-lite beats persistence by **≥ 10pp** OOS; the report **names the feature-count** where `bundle` crosstalk breaks recall. |
| **3** | The operator loop | **I/H**: **≥ 3** revision cycles offline; **≥ 1** filed autopsy; **≥ 3** attributed index entries; **0** network calls; **0** `.local` leaks. |
| **4** | Commons + privacy spine | **U/A/N/I/T**: **0** `.local` tokens across **100** commons exports; ledger tallies a **3-contributor** fixture; index split public ⟂ `.local`; headers trilingual TR→EN→ZH. |

### KPI dashboard (the gauges we read every arc)

| KPI | Definition | Target | HUMANITIK |
|---|---|---|---|
| **Research velocity** | strategy objects compiled → courted → autopsied per session | trending up; ≥ 3 revision cycles/loop | I (iterative) |
| **Leakage catch rate** | injected look-ahead leaks the guard catches | **100%** (non-negotiable) | H (honest) |
| **Failure coverage** | fraction of tested variants with a filed autopsy | **100%** — no silent discards | A / moat |
| **Regime accuracy** | held-out regime classification (4-regime synthetic) | **≥ 70%** (chance 25%) | M (measured) |
| **Commons health** | attributed nodes; open index entries; 3-contributor ledger green | growing; ledger balanced | N / A / I |
| **Privacy leaks** | `.local` tokens in any commons export | **0** (Article 0) | U (user-owned) |

The two numbers that may never move: **leakage catch = 100%** and **privacy leaks = 0.** Everything
else is allowed to be a work in progress; those two are the floor.

---

## 8. Non-goals & risks

> **TR** — Dürüstlük başarı ölçütüdür; getiri değil. **EN** — Honesty is the success metric, not
> return. **ZH** — 诚实是成功的衡量标准，而非收益。

**Non-goals (what ark deliberately is NOT):**
- **Not HFT.** Daily/weekly horizons; we have no latency edge and seek none.
- **No live capital.** Ever, in this plan. Synthetic market today; point-in-time real OHLCV behind the
  same contract later — still no orders, no broker, no money.
- **Not a price oracle.** We refuse the prediction promise on purpose (Section 2).
- **Not public until notice.** No push, no remote, no GitHub; local-only on this Mac.

**Risks & the defenses already in code:**
- *Overfitting / multiple testing* → walk-forward OOS reported separately; **every** variant logged to
  the failure database (no silent discards).
- *Look-ahead leakage* → `leakage_guard` corrupts the future and refuses peekers (catch target 100%).
- *Cost/capacity fantasy* → `fees_slippage` charges turnover; gross-exposure caps in the contract.
- *Regime brittleness* → evaluate across all synthetic regimes; report per-regime; **respect and
  report the measured walls** (TC⁰, abelian penalty, capacity envelope, seq_len≈256) rather than
  pretending they aren't there.
- *Self-revision drift* → Article 0 is the alignment anchor a self-rewriting system cannot move; the
  meta-test guards the guard.

**The success metric, restated:** ark wins when a *dead* strategy produces a clean, filed autopsy —
when the leakage-guard passes, costs are charged, OOS is honest, and the failure is remembered. We are
not optimizing for return. We are optimizing for **earned trust** — and trust is honesty, measured.
