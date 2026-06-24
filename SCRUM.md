# SCRUM — ark · SMART technical goals for the build teams

> **TR** — Bu, `ark` (Makro Strateji OS) için bir scrum sırt çantasıdır: ölçülebilir hedefler,
> kullanıcı hikâyeleri ve sprint planı; her hedef bir test betiğine, bir sayıya ve bir sprinte bağlı.
> Önce Madde 0; dürüstlük metriktir, çürütülen strateji bir sonuçtur.
>
> **EN** — This is a scrum backlog for `ark` (the Macro Strategy OS): measurable goals, user stories,
> and a sprint plan; every goal ties to a test script, a number, and a sprint. Article 0 first;
> honesty is the metric, a refuted strategy is a result.
>
> **ZH** — 这是 `ark`（宏观策略 OS）的 scrum 待办列表：可度量的目标、用户故事与冲刺计划；每个目标都
> 绑定到一个测试脚本、一个数字和一个冲刺。第 0 条优先；诚实是衡量标准，被驳倒的策略也是一种成果。

**Status: LIVING BACKLOG** · grounded in the green floor (`make floor`, `make test` — 7 suites green).
Local-only, offline, numpy/pandas only. **Not public until notice.** No live capital, ever in this plan.

Run the gates anytime:
```bash
make floor    # PYTHONPATH=. python3 -m foundation.selftest      (VSA laws + court + guards + edge-in-bits)
make test     # PYTHONPATH=. python3 tests/run_all.py            (test_kernel/backtest/constitution/index/trigram/commons/spine)
make f01      # PYTHONPATH=. python3 experiments/f01_ethical_backtest/run.py
```

---

## Teams (4)

| Team | Mission (one sentence) | Primary modules |
|---|---|---|
| **Court / Evidence** | Keep the backtest honest — purged folds, costs that bite, leakage caught, edge reported in bits against `C(D)` and never past it. | `foundation/backtest/**`, `foundation/spine/**`, `tests/test_backtest.py`, `tests/test_spine.py` |
| **Regime / Substrate** | Own the FHRR VSA kernel + JEPA-lite transition predictor; describe regimes commutatively and **report the capacity wall** where `bundle` crosstalk breaks. | `foundation/kernel/**`, future `foundation/regime/**`, `tests/test_kernel.py` |
| **Commons / HUMANITIK** | Build the local index, failure database, attribution ledger, and trigram economy; file autopsies and credit contributors with zero `.local` leakage. | `foundation/index/**`, `foundation/operator/**`, `tests/test_index.py`, `tests/test_trigram.py`, `tests/test_commons.py` |
| **Platform / Health** | Guard Article 0, the weight-vector contract, computational-health checks, and the green-floor CI; every outbound path is a `PermissionError` if `.local`. | `foundation/privacy/**`, `foundation/health/**`, `foundation/kernel/contracts.py`, `foundation/selftest.py`, `tests/test_constitution.py` |

---

## Product backlog — EPICS mapped to the arcs

| Epic | Arc | Theme | Owning team(s) |
|---|---|---|---|
| **E1 — Harden the evidence court** | Arc 1 | purged/embargoed folds · point-in-time real adapter · survivorship · tear-sheet | Court / Evidence |
| **E2 — Regime layer (VSA + JEPA-lite)** | Arc 2 | encode → codebook → cleanup → transition predictor · report the wall | Regime / Substrate |
| **E3 — The operator loop** | Arc 3 | thesis → StrategyObject → court → autopsy → revise (deterministic first) | Commons / HUMANITIK + Regime / Substrate |
| **E4 — Commons + privacy spine** | Arc 4 | attribution ledger · 95/5 trigram split · privacy fuzz · trilingual headers | Commons / HUMANITIK + Platform / Health |
| **E5 — Platform health & green floor** | cross-arc | health checks · contract guards · CI floor stays GREEN | Platform / Health |

---

## EPIC E1 — Harden the evidence court (Arc 1)

**E2E bar (PLAN/MASTERPLAN):** purged/embargoed folds with **zero** train/test overlap; an injected
leak collapses OOS Sharpe **≥ 50%** vs IS; the cost model shifts a zero-cost backtest by **exactly**
the modeled bps. All asserted in `tests/test_backtest.py`.

- **E1-S1 — Purged & embargoed folds.** *As a* researcher, *I want* walk-forward folds with a purge
  gap and an embargo window, *so that* train and test never share information across the boundary.
  - **AC (SMART):** `walk_forward(purge=P, embargo=E)` produces folds whose train/test index
    intersection size is **exactly 0** across all folds; a new `test_backtest.py::test_purged_folds`
    asserts `overlap == 0` and runs green. *Time-bound: Sprint 1.*
  - **Points: 5** · **Team: Court / Evidence**
- **E1-S2 — Leak collapse assertion.** *As a* skeptic, *I want* an injected look-ahead variant to be
  caught and scored honestly, *so that* leakage cannot inflate a verdict.
  - **AC (SMART):** with `leaky_oracle` injected, `test_backtest.py::test_leak_collapses` asserts OOS
    Sharpe drops **≥ 50%** vs IS **and** `leakage_guard` flags `leak=True`; the clean momentum baseline
    keeps `leak=False`. Catch rate measured over **20** injected variants = **100%**. *Sprint 1.*
  - **Points: 3** · **Team: Court / Evidence**
- **E1-S3 — Exact cost model.** *As an* operator, *I want* turnover costs charged at a configured bps,
  *so that* a zero-cost backtest and a costed one differ by precisely the modeled drag.
  - **AC (SMART):** `test_backtest.py::test_cost_exact` asserts `gross_return − net_return ==
    turnover × bps` to within `1e-9`; passes for bps ∈ {0, 5, 25}. *Sprint 1.*
  - **Points: 3** · **Team: Court / Evidence**
- **E1-S4 — Point-in-time real adapter + survivorship + tear-sheet.** *As a* researcher, *I want* a
  free daily-OHLCV adapter behind the **same** weight-vector contract with survivorship flagged,
  *so that* f01 re-runs on real data unchanged and the verdict prints a tear-sheet.
  - **AC (SMART):** adapter loads a cached point-in-time fixture (offline, no network — asserted by a
    `0 network calls` check), exposes the same `Strategy`/`prices` interface as `synthetic.py`, flags a
    delisted ticker, and `make f01` emits a tear-sheet with OOS edge in **bits** + `capacity_bits`.
    `test_backtest.py::test_real_adapter` green. *Sprint 2.*
  - **Points: 8** · **Team: Court / Evidence**

## EPIC E2 — Regime layer: VSA + JEPA-lite (Arc 2)

**E2E bar:** held-out 4-regime classification **≥ 70%** (chance 25%); JEPA-lite beats persistence by
**≥ 10pp** OOS; the report **names the feature-count** where `bundle` crosstalk breaks recall.

- **E2-S1 — Encode snapshots → regime hypervectors.** *As a* regime modeler, *I want* market snapshots
  encoded as `bind(feature:level)` then `bundle`d into one FHRR vector, *so that* "what regime am I in"
  is a commutative description, not a prediction.
  - **AC (SMART):** new `foundation/regime/encode.py`; `bind→unbind` round-trip ≥ **+0.99** cosine
    (already true in `test_kernel`); encode is order-invariant — shuffling the feature order changes the
    bundled vector cosine by **< 1e-6**. `test_regime.py::test_commutative` green. *Sprint 2.*
  - **Points: 5** · **Team: Regime / Substrate**
- **E2-S2 — Codebook + cleanup classifier.** *As a* researcher, *I want* a 4-regime codebook with
  `cleanup` nearest-regime recall, *so that* held-out snapshots are classified honestly above chance.
  - **AC (SMART):** held-out accuracy **≥ 70%** on the 4-regime synthetic problem (chance 25%), printed
    by `make floor`/`f01` and asserted in `test_regime.py::test_accuracy`. *Sprint 3.*
  - **Points: 5** · **Team: Regime / Substrate**
- **E2-S3 — Report the capacity wall.** *As a* skeptic, *I want* the encoder to sweep vocab/depth and
  name where `bundle` crosstalk crashes recall, *so that* we respect the measured envelope (D=128 →
  ~vocab 24 @ depth 10) and never claim past it.
  - **AC (SMART):** `test_regime.py::test_capacity_wall` runs a sweep, asserts recall ≥ 0.9 below the
    reported `vocab*` and < 0.9 above it, and the report **prints the integer feature-count** where it
    breaks. *Sprint 3.*
  - **Points: 3** · **Team: Regime / Substrate**
- **E2-S4 — JEPA-lite transition predictor.** *As an* operator, *I want* a numpy JEPA-lite predicting
  regime_t → regime_{t+1}, *so that* I forecast the next regime (not price) and beat a naive baseline.
  - **AC (SMART):** OOS next-regime accuracy beats the persistence baseline by **≥ 10pp**; no torch, no
    network (numpy/pandas only — asserted by import check). `test_regime.py::test_jepa_beats_persistence`
    green. *Sprint 3.*
  - **Points: 8** · **Team: Regime / Substrate**

## EPIC E3 — The operator loop (Arc 3)

**E2E bar:** **≥ 3** revision cycles offline; **≥ 1** filed autopsy; **≥ 3** attributed index entries;
**0** network calls; **0** `.local` leaks.

- **E3-S1 — thesis → StrategyObject compiler (deterministic).** *As an* operator, *I want* a thesis
  compiled into a `StrategyObject` filling the ordered `selection→allocation→timing→risk` pipeline,
  *so that* the non-abelian composition lives in the operator layer, never the VSA.
  - **AC (SMART):** `operator/compile.py` produces a valid object whose `target_weight` passes
    `validate_weights` (finite, gross ≤ cap) on **100/100** timesteps; `test_operator.py::test_compile`
    green; deterministic — no LLM, no network. *Sprint 3.*
  - **Points: 5** · **Team: Commons / HUMANITIK**
- **E3-S2 — court → autopsy → revise cycle.** *As an* operator, *I want* the loop to read the court
  verdict, file an autopsy when a strategy dies, and revise, *so that* depth accumulates across passes
  past the TC⁰ ceiling and nothing is silently discarded.
  - **AC (SMART):** a single `make` target runs **≥ 3** revision cycles, files **≥ 1** autopsy to the
    failure DB, and logs **every** variant (failure coverage = **100%**); `test_operator.py::test_loop`
    asserts cycle count ≥ 3 and autopsy count ≥ 1. *Sprint 3.*
  - **Points: 8** · **Team: Commons / HUMANITIK + Regime / Substrate**
- **E3-S3 — Attribution on every filed lesson.** *As a* contributor, *I want* each autopsy/lesson
  credited in the local index, *so that* the strongest objection wins and its author is in the ledger.
  - **AC (SMART):** the loop writes **≥ 3** attributed index entries (self-recall already 12/12 in
    `test_index`); `test_operator.py::test_attribution` asserts each filed lesson has a non-empty
    contributor field and a recall cosine ≥ 0.9. *Sprint 4.*
  - **Points: 3** · **Team: Commons / HUMANITIK**

## EPIC E4 — Commons + privacy spine (Arc 4)

**E2E bar:** **0** `.local` tokens across **100** commons exports; the ledger tallies a **3-contributor**
fixture; index split public ⟂ `.local`; headers trilingual TR→EN→ZH.

- **E4-S1 — Privacy fuzz: 0 leaks / 100 exports.** *As the* privacy spine, *I want* a fuzz test that
  pushes 100 random artifacts (some carrying `.local` tokens / `PRIVATE::` tags) through `publish()`,
  *so that* every `.local`-tainted one raises `PermissionError`.
  - **AC (SMART):** `test_constitution.py::test_publish_fuzz` runs **100** exports, asserts **0**
    `.local` tokens escape and **100%** of tainted artifacts are refused; the meta-test still fails if
    the guard is deleted. *Sprint 4.*
  - **Points: 5** · **Team: Platform / Health**
- **E4-S2 — Attribution ledger, 3-contributor fixture.** *As a* commons steward, *I want* a ledger that
  tallies contributions and applies the 95/5 cartographer/foundation split, *so that* credit is
  balanced and the 5% foundation cost is conserved.
  - **AC (SMART):** `test_commons.py::test_ledger` runs a **3-contributor** fixture, asserts tallies sum
    to total contributions, the foundation share equals **exactly 5%** (within 1e-9), and the ledger
    balances. *Sprint 4.*
  - **Points: 3** · **Team: Commons / HUMANITIK**
- **E4-S3 — Index split: public commons ⟂ `.local`.** *As a* researcher, *I want* the index to hold
  public commons entries separate from any `.local` provenance, *so that* exports never carry a private
  position.
  - **AC (SMART):** `test_index.py::test_split` asserts a `.local`-tagged entry is never returned by a
    public-scope query (0 leaks across the seeded set) while public self-recall stays at **12/12**.
    *Sprint 4.*
  - **Points: 3** · **Team: Commons / HUMANITIK + Platform / Health**

## EPIC E5 — Platform health & green floor (cross-arc)

- **E5-S1 — Computational-health checks PASS.** *As a* maintainer, *I want* `foundation/health/` to
  probe this Mac's limits (D, vocab, seq window) and report walls honestly, *so that* we never claim
  past a measured wall.
  - **AC (SMART):** `health.check()` returns a PASS/FAIL report naming the seq_len≈256 and capacity
    walls; `make floor` prints `HEALTH: PASS` and a `test_health.py::test_walls` suite is green and
    added to `tests/run_all.py`. *Sprint 2.*
  - **Points: 3** · **Team: Platform / Health**
- **E5-S2 — Edge-in-bits never exceeds capacity.** *As a* skeptic, *I want* the court to flag
  `capacity_exceeded` whenever claimed OOS bits would exceed `C(D)=0.386·D`, *so that* no verdict claims
  past the Shannon converse.
  - **AC (SMART):** `test_spine.py`/`test_backtest.py` assert `held_bits ≤ capacity_bits` or
    `capacity_exceeded=True` on **100%** of runs; property test (`test_spine_props.py`) stays green over
    randomized inputs. *Sprint 1.*
  - **Points: 2** · **Team: Platform / Health**
- **E5-S3 — Green-floor CI on every increment.** *As a* team, *I want* `make floor && make test` wired
  into a local pre-commit gate, *so that* no increment merges red.
  - **AC (SMART):** a `.github`/local hook runs both gates; **7/7** (then 8+/8+) suites green is required
    for a commit; floor prints `FLOOR: GREEN`. *Sprint 1.*
  - **Points: 2** · **Team: Platform / Health**

---

## Definition of Done (shared, every story)

A story is **Done** only when all hold:
1. **Builds & runs offline** on this Mac — numpy/pandas only, no torch, no network in the system path.
2. **Has a green test script** — a named `tests/test_*.py::test_*` (added to `tests/run_all.py`) and
   `make floor` still prints `FLOOR: GREEN`; the metric in the AC is asserted with a concrete number.
3. **One clean local commit** — no remote, no push (not public until notice); message trilingual-tagged
   where user-facing.
4. **Respects Article 0** — no `.local` read/write/echo; every outbound path routes through
   `publish_guard.publish()`; the meta-test that guards the guard stays green.
5. **Reports honestly** — edge in **bits** capped by `C(D)`; measured walls (TC⁰, abelian penalty,
   capacity envelope, seq_len≈256) reported, never claimed past; failures filed, not discarded.
6. **Trilingual docs (TR→EN→ZH)** on any user-facing header or report.

The two numbers that may **never** move: **leakage catch = 100%** and **privacy leaks = 0.**

---

## Sprint plan — four two-week sprints

### Sprint 1 — "Honest court: bits, purged folds, leak collapse" (Arc 1 core)
- **Stories:** E1-S1 (5), E1-S2 (3), E1-S3 (3), E5-S2 (2), E5-S3 (2) — **15 pts**
- **Measurable sprint goal:** purged folds with train/test overlap = **0**; injected leak collapses OOS
  Sharpe **≥ 50%** with leakage-catch = **100%** over 20 variants; cost model exact to `1e-9`; OOS edge
  reported in **bits** with `held_bits ≤ capacity_bits` on 100% of runs; CI floor GREEN, 8 suites green.

### Sprint 2 — "Real-data adapter + regime encoder + health" (Arc 1 close → Arc 2 start)
- **Stories:** E1-S4 (8), E2-S1 (5), E5-S1 (3) — **16 pts**
- **Measurable sprint goal:** point-in-time real adapter runs f01 unchanged behind the same contract
  with **0** network calls and a survivorship flag; regime encode is order-invariant (cosine drift
  **< 1e-6**); `HEALTH: PASS` printed naming the seq_len≈256 + capacity walls.

### Sprint 3 — "Regime classifies + JEPA-lite + the loop turns" (Arc 2 close → Arc 3 core)
- **Stories:** E2-S2 (5), E2-S3 (3), E2-S4 (8), E3-S1 (5), E3-S2 (8) — **29 pts** *(two-pair team split:
  Regime/Substrate carries E2, Commons carries E3; descope E3-S2 to Sprint 4 if velocity < 24)*
- **Measurable sprint goal:** held-out regime accuracy **≥ 70%** (chance 25%); JEPA-lite beats
  persistence by **≥ 10pp** OOS; the report **names the feature-count** where `bundle` recall breaks;
  the operator loop runs **≥ 3** revision cycles and files **≥ 1** autopsy with failure coverage = 100%.

### Sprint 4 — "Commons, attribution, privacy fuzz" (Arc 3 close → Arc 4)
- **Stories:** E3-S3 (3), E4-S1 (5), E4-S2 (3), E4-S3 (3) — **14 pts**
- **Measurable sprint goal:** **0** `.local` tokens across **100** commons exports (guard meta-test
  green); ledger tallies a **3-contributor** fixture with foundation share = **exactly 5%**; index split
  keeps public self-recall **12/12** while leaking **0** `.local` entries; **≥ 3** attributed entries.

---

## KPIs / velocity (read every sprint)

| KPI | Definition | Target | Tied to |
|---|---|---|---|
| **Research velocity** | StrategyObjects compiled → courted → autopsied per loop | trending up; **≥ 3** revision cycles/loop | E3-S2 `test_operator::test_loop` |
| **Leakage catch rate** | injected look-ahead leaks the guard catches | **100%** (non-negotiable) | E1-S2 `test_backtest::test_leak_collapses` |
| **Failure coverage** | tested variants with a filed autopsy | **100%** — no silent discards | E3-S2 failure DB |
| **Regime accuracy** | held-out 4-regime classification (chance 25%) | **≥ 70%** | E2-S2 `test_regime::test_accuracy` |
| **JEPA edge** | next-regime accuracy vs persistence | **≥ +10pp** OOS | E2-S4 `test_regime::test_jepa_beats_persistence` |
| **Capacity honesty** | claimed OOS bits vs `C(D)=0.386·D` | `held_bits ≤ capacity_bits` on **100%** runs | E5-S2 `test_spine_props` |
| **Privacy leaks** | `.local` tokens in any commons export | **0** (Article 0) | E4-S1 `test_constitution::test_publish_fuzz` |
| **Health checks** | this-Mac limit probes report walls | **PASS** | E5-S1 `make floor` → `HEALTH: PASS` |
| **Green floor** | `make floor && make test` suites | **all green** (≥ 8/8) | E5-S3 CI gate |

**Velocity baseline:** assume **~15 pts/sprint** until measured; re-baseline after Sprint 1's actuals.
Sprint 3 is intentionally heavy (29 pts) and split across two teams — descope E3-S2 to Sprint 4 if the
Sprint 1–2 velocity lands below 24. The two floors — **leakage catch = 100%** and **privacy leaks = 0** —
are gates, not goals: a sprint with either red does not close.
