# ARCHITECTURE — the cyber repo (cybernetic feedback + cyber-secure privacy)

> **TR** — Mimari: beş katman, tek geri besleme döngüsü ve mimarinin kendisinden gelen gizlilik.
> Operatör döngüsü katmanları diker; her dışa açılan yol Madde 0'dan geçer. *(Türkçe önce gelir.)*
>
> **EN** — The architecture: five layers, one feedback loop, and privacy that comes from the
> shape of the repo itself. The operator loop stitches the layers; every outbound path passes
> through Article 0.
>
> **ZH** — 架构：五层、一个反馈回路，以及源自仓库形态本身的隐私。算子回路缝合各层；每条对外
> 路径都要经过第 0 条。

**Status: LIVING MAP** · grounded in the green floor (`foundation.selftest`). Not public until notice.

---

## 1. The annotated tree (every dir + file, one responsibility each)

```
ark/
├── README.md                     entry point: the five layers + four common codes (TR→EN→ZH)
├── CONTRIBUTING.md               the charter: Article 0 + the ESG body + how contribution works
├── PLAN.md                       arc-by-arc build plan, each arc gated by an E2E test
├── ARCHITECTURE.md               THIS FILE — the cyber repo map + feedback wiring + secure posture
├── VAULTS.md                     the two-vault model: open commons ⟂ .local private vault
├── FORUM.md                      ethics forum map: Discussions ↔ EDR nodes ↔ ratification loop
├── .gitignore                    Article 0.1 mechanism — .local hard-ignored (top of file, locked)
│
├── foundation/                   the readable floor — everything that runs offline, numpy-only
│   ├── __init__.py               package marker
│   ├── selftest.py               ONE command proves the floor is GREEN (VSA laws+court+guards)
│   │
│   ├── kernel/                   LAYER 2+3 substrate — the irreducible primitives
│   │   ├── __init__.py           package marker
│   │   ├── vsa.py                the 5 VSA primitives (FHRR torus kernel): rand_hv/bind/unbind/
│   │   │                         bundle/permute/similarity/cleanup — commutative regime substrate
│   │   ├── contracts.py          the weight-vector contract w_t (validate_weights, Strategy proto)
│   │   └── strategy_object.py    the atomic product: StrategyObject; the NON-ABELIAN pipeline lives here
│   │
│   ├── operator/                 LAYER 1 — the builder/operator (carries depth + ordered pipeline)
│   │   ├── __init__.py           package marker
│   │   └── baselines.py          clean momentum (causal) + leaky_oracle (a known cheat to catch)
│   │
│   ├── backtest/                 the EVIDENCE COURT — honesty machinery (the falsifier)
│   │   ├── __init__.py           package marker
│   │   ├── synthetic.py          regime-switching market + ground-truth labels (offline, seeded)
│   │   ├── fees_slippage.py      transaction costs charged on turnover (conservative bps)
│   │   ├── leakage_guard.py      look-ahead detector: corrupt the future, refuse peekers
│   │   └── walk_forward.py       causal IS/OOS engine; refuses to score a leaking strategy
│   │
│   ├── privacy/                  LAYER 5 — the privacy spine / alignment anchor
│   │   ├── __init__.py           package marker
│   │   └── publish_guard.py      Article 0.2/0.3 in code: the ONLY sanctioned outbound path
│   │
│   ├── constitution/             the governance text (ratified + proposed)
│   │   ├── 00-eternity-clause.md Article 0 — RATIFIED, non-amendable, non-proposable
│   │   ├── E-environmental.md    EDR stub — Environmental (PROPOSED)
│   │   ├── S-social.md           EDR stub — Social / HUMANITIK (PROPOSED)
│   │   └── G-governance.md       EDR stub — Governance (PROPOSED)
│   │
│   └── nodes/                    the architecture nodes — what each layer IS and why
│       ├── 00-thesis.md          "engineer strategies, don't predict prices"
│       ├── 01-operator.md        why the agent loop carries depth + non-abelian composition
│       ├── 02-regime.md          the 5 primitives + capacity envelope + abelian-only
│       └── 03-execution.md       the weight-vector contract as the stable interface
│
└── tests/                        the gates
    ├── run_all.py                runs every suite
    ├── test_kernel.py            VSA laws hold (bind→unbind ≈ +1, orthogonality, cleanup)
    ├── test_backtest.py          court is honest (OOS finite, costs bite, leak caught)
    └── test_constitution.py      Article 0 holds (.local unpublishable, guard present)
```

> Not yet built (named in PLAN/README; placeholders the tree expects): `foundation/regime/`
> (JEPA-lite transition predictor), `foundation/index/` (HUMANITIK commons index + failure DB),
> `experiments/f01_ethical_backtest/`. They land behind the SAME contracts, so the wiring below
> does not change when they arrive.

---

## 2. The cybernetic feedback wiring (how the operator loop threads the five layers)

The product is not a model output; it is a **loop**: `state → action → feedback → revision`.
The repo is shaped so that loop runs through all five layers and closes on itself.

```
        ┌──────────────────────────── THE OPERATOR LOOP ─────────────────────────────┐
        │                                                                             │
   (data)                                                                             │
 synthetic.py ──▶ [2] REGIME ENCODE ──▶ [1] OPERATOR COMPOSES ──▶ [3] EXECUTION ──▶ [court]
 prices,labels    kernel/vsa.py          StrategyObject            contract w_t      backtest/
                  bind feat:level        selection→allocation      validate_weights  walk_forward
                  bundle → regime hv     →timing→risk (ORDERED)    (the interface)   +costs+leak
                  cleanup → "what            ▲                          │                │
                   regime am I in"           │                         │              verdict
                       │                     │  revise (new thesis,     │            (OOS sheet
                       │                     │   new pipeline order,     │             or autopsy)
                       │                     │   tighter risk)           │                │
                       │                     └───────────◀──────────────┴──────◀──────────┘
                       │                                  [4] COMMONS — index/ (HUMANITIK)
                       │                                  attribution + FAILURE DATABASE
                       └──────────────────────────────────────────────────────────────┘
                            regime description feeds the next compose (feedback memory)
```

Step by step:

1. **data → regime-encode.** `backtest/synthetic.py` emits point-in-time prices (+ ground-truth
   labels for grading). The regime layer (`kernel/vsa.py`, future `regime/`) binds `feature:level`
   pairs and `bundle`s them into one FHRR hypervector, then `cleanup`s against a regime codebook to
   answer the **commutative** question: *what regime is this?* This is description, not prediction.
2. **operator composes the StrategyObject.** Given a thesis + the regime description, the operator
   layer fills `selection → allocation → timing → risk`. Order matters (§4) — this is the
   **non-abelian** composition, and it lives in the operator, never the substrate.
3. **execution contract w_t.** `StrategyObject.target_weight(prices, t)` terminates in a single
   target weight, validated by `kernel/contracts.py`. Everything upstream can change; this face cannot.
4. **evidence court.** `backtest/walk_forward.py` runs the strategy causally, charges costs
   (`fees_slippage.py`), and **refuses to score** anything `leakage_guard.py` catches peeking.
   It reports IS vs OOS separately; **only OOS counts**.
5. **index / failure-DB (feedback).** The verdict — an OOS tear-sheet if it lives, an **autopsy** if
   it dies — is filed to the commons (future `foundation/index/`, HUMANITIK). A refuted strategy is a
   *result*, attributed and reusable; nothing is silently discarded.
6. **revise.** The operator reads the autopsy and revises: new thesis, re-ordered pipeline, tighter
   risk overlay. The loop closes. Depth accumulates **across passes**, not within one (§4, TC⁰).

The feedback is genuinely *cybernetic*: the system observes the consequence of its own action
(the court verdict), updates its memory (the failure DB), and acts again. The regime description
from step 1 also persists as feedback into the next compose — the loop carries state forward.

---

## 3. Secure-by-architecture posture

Privacy here is not a setting; it is the **shape** of the repo. Two facts make leakage structurally
hard rather than merely discouraged.

**The two vaults (see `VAULTS.md`).**

```
  OPEN COMMONS  (committable, attributed)        ⟂        .local  PRIVATE VAULT (Article 0)
  foundation/**, tests/**, *.md                            positions, identities, live params
  flows OUT through publish() only                         system-written; never leaves the Mac
```

**Article 0 at every outbound path.** Every export, forum post, log, or telemetry line MUST route
through `foundation/privacy/publish_guard.py::publish()`. It calls `assert_publishable()`, which
refuses any artifact carrying a `.local` path token or a `PRIVATE::` tag. A constitutional rule
unenforced in code is a prayer; this one is a `PermissionError`.

**The recursive lock (why it can't be quietly undone).**

| Rule | Guards | Mechanism | Test |
|---|---|---|---|
| 0.1 | the DATA | `.gitignore` hard entry (`.local`, `*.local`, `**/.local/`) | `gitignore_hardens_local()` / `git check-ignore` |
| 0.2 | every channel | `publish_guard.is_publishable()` blocks `.local` provenance | fuzz: 0 leaks / 100 exports |
| 0.3 | 0.2's guard | guard is committed, wired into every publish entrypoint | `guard_is_present()` / meta-test — fails if deleted |
| 0.4 | 0.3's protection | EDR template offers no "amend Article 0" path; forum auto-closes such threads | `reject_article0_proposals` (forum CI) |

0.3's test is the clever one — a **meta-test that guards the guard**. You cannot comment out privacy
without a red test. And 0.4 puts the lock itself outside the deliberation surface: it cannot even be
*proposed* away (see `FORUM.md` — Article 0 is non-justiciable).

---

## 4. Each LABNOTES wall ↔ the module boundary that respects it

The lineage walls are **measured** (gen-1..gen-5). The repo's module boundaries are not stylistic —
each one is the architectural answer to a wall. A refuted idea is a result, so each wall is honored,
not hidden.

| LABNOTES wall (measured) | What it forbids | Module that respects it | How |
|---|---|---|---|
| **TC⁰ ceiling** | unbounded sequential composition in one pass | `operator/` + `backtest/walk_forward` | depth comes from the **operator loop across passes**, not one forward pass; revision cycles supply the sequential composition the substrate can't |
| **abelian-only** (bind commutes) | order-dependent composition inside the VSA | `kernel/vsa.py` (regime) vs `kernel/strategy_object.py` (operator) | the **commutative** regime description stays in the VSA; the **ordered** pipeline is lifted into the StrategyObject |
| **non-abelian penalty 0.3–0.6** | forcing ordered composition through bind | the `target_weight` method, not the kernel | `selection→allocation→timing→risk` is plain Python ordering — it never pays the substrate's non-commutativity tax |
| **capacity envelope** (D=128 → ~vocab 24 @ depth 10) | bundling too many items before crosstalk crashes | `kernel/vsa.bundle` + future `regime/` codebook | "store **factors** not items"; bind `feature:level` factors, bundle few, `cleanup` against a small codebook; the arc reports the feature-count where recall breaks |
| **seq_len ≈ 256 wall** | long raw sequences in one shot | `backtest/walk_forward` windowing + operator memory | history is summarized to a regime hypervector + `post_trade_memory`, not fed as one long sequence |

### Why the split is forced (not aesthetic)

- **Non-abelian pipeline → `operator/`.** `selection→allocation→timing→risk` is *order-dependent*:
  sizing before selecting, or risk before timing, is a different strategy. The VSA substrate is
  **measured** to penalize non-commutative composition (bind is commutative: `a*b == b*a`). So the
  ordered pipeline is lifted out of the kernel into `StrategyObject.target_weight`, where ordering is
  free. The code says so in `strategy_object.py`: *"order matters (non-commutative) BY DESIGN — this
  is the operator-layer composition."*
- **Commutative regime → `regime/` (kernel `vsa.py`).** "What regime am I in" is a *set/description*:
  `bind(feature, level)` then `bundle(...)` is order-free by construction, which is exactly the
  substrate's native, untaxed lane. So the regime layer holds the commutative content, and only that.

The two questions have different algebra, so they live in different modules. That is the whole
architecture in one sentence: **commutative description in the substrate, ordered engineering in the
operator, a stable contract between them, a court that only trusts OOS, and a lock that privacy can't
be argued out of.**
