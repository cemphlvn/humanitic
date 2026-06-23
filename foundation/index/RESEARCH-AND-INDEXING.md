# Araştırma ve İndeksleme · Research & Indexing · 研究与索引

> **TR** — Yerel bilgi indeksinin (HUMANITIK ortak hazinesi + BAŞARISIZLIK VERİTABANI) planı.
> İndeks, operatör döngüsünün BELLEĞİDİR: bir rejimi gör → en yakın geçmiş rejime `cleanup` ile
> eriş → orada neyin işe yaradığını, neyin öldüğünü hatırla. Substrat ABELYEN'dir ve ÖLÇÜLMÜŞ
> duvarları vardır; indeks bu duvarlara SAYGI gösterir ve onları RAPOR eder. "Öğeleri değil,
> faktörleri sakla."
>
> **EN** — The plan for the local knowledge index (the HUMANITIK commons + the FAILURE DATABASE).
> The index is the operator loop's MEMORY: see a regime → reach the nearest historical regime via
> `cleanup` → recall what worked and what died there. The substrate is ABELIAN with MEASURED walls;
> the index RESPECTS those walls and REPORTS them. "Store factors, not items."
>
> **ZH** — 本地知识索引（HUMANITIK 公共池 + 失败数据库）的规划。索引就是操作员循环的记忆：
> 看到一个制度 → 用 `cleanup` 找到最近的历史制度 → 回忆那里什么有效、什么死掉了。底层是阿贝尔
> （可交换）的，且有实测的墙；索引尊重并报告这些墙。"存储因子，而非条目。"

---

## 0. What this is, in one line

A numpy-only, offline associative memory over our own research, where the **address of every memory
is an FHRR regime vector** built with the five VSA primitives (`foundation/kernel/vsa.py`), and the
crown jewel is the **failure database**: the autopsies of dead strategies.

We do not predict prices. We engineer, test, repair, and **remember**. The index is the remembering.

---

## 1. WHAT the index holds

Seven kinds (full schema in [`schema.md`](schema.md)):

- **regimes** — named market states; the recall anchors everything else hangs off of.
- **strategies** — de-identified `StrategyObject` snapshots (`foundation/kernel/strategy_object.py`).
- **results / tear-sheets** — OOS Sharpe, max-DD, turnover, per-regime breakdown, walk-forward folds.
- **lessons** — distilled, reusable findings with evidence links.
- **FAILURE AUTOPSIES** — why a strategy died (§4). The moat.
- **macro theses** — statements with an explicit mechanism and falsifier.
- **sources / citations** — datasets, papers, URLs/DOIs, licenses, accessed dates.

Every entry is addressed by a `regime_vector` and stamped `public` or `local` provenance.

---

## 2. The entry schema (summary)

Full field-by-field in [`schema.md`](schema.md). The load-bearing fields:

```
id · kind · content
regime_vector  (FHRR complex64[D])      <- the address
regime_factors (the named factors, ≤ FACTOR_CAP)
provenance     (public | local)         <- Article 0 gate
contributor · co_contributors · attribution_count   <- HUMANITIK ledger
links[] (edges: revises|refutes|supports|caused_by|derived_from|cites)
```

---

## 3. The indexing pipeline: capture → encode → store → retrieve

**capture → encode to an FHRR regime vector → store → retrieve via nearest-regime cleanup.**

The encoding is the only subtle part, and it uses the real API verbatim
(`rand_hv, bind, bundle, cleanup, similarity` from `foundation.kernel.vsa`).

### Encode — `bind(feature, level)` then `bundle`

A regime is a small set of `feature:level` facts ("rates: rising", "vol: high"). We give every
feature-name and every level-name a fixed random hypervector (a *codebook*), `bind` each
feature to its level (binding is `a*b` — phases ADD, invertible), and `bundle` the bound pairs into
one superposition (the regime vector).

```python
import numpy as np
from foundation.kernel import vsa

D = 128                                   # the kernel's measured operating dimension
rng = np.random.default_rng(0)

# fixed codebooks: one hypervector per feature-name and per level-name (built once, reused)
feat_hv  = {f: vsa.rand_hv(D, rng) for f in ["rates", "vol", "trend", "liquidity"]}
level_hv = {l: vsa.rand_hv(D, rng) for l in ["rising", "falling", "high", "low", "up", "down"]}

def encode_regime(facts):                 # facts = {"rates":"rising", "vol":"high", ...}
    assert len(facts) <= FACTOR_CAP, "bundle wall: too many factors (see §5)"
    pairs = [vsa.bind(feat_hv[f], level_hv[l]) for f, l in facts.items()]
    return vsa.bundle(pairs)              # ONE regime hypervector — the entry's address

v_today = encode_regime({"rates": "rising", "vol": "high", "trend": "down"})
```

`bind` makes "rates IS rising" a single role:filler binding; `bundle` superposes the facts into a
set. Two regimes that share facts have high `vsa.similarity`; that is the whole retrieval mechanism.

### Store

Write `{id, kind, content, regime_vector: v, regime_factors: list(facts), provenance, contributor, ...}`.
Public entries go to the commons via `publish_guard.publish` (§6); local entries stay on-machine.
Maintain a parallel **regime codebook**: `codebook = np.stack([entry.regime_vector for entry in regimes])`.

### Retrieve — `cleanup` top-k nearest regime

To use the index as memory, encode the *current* regime and snap it to the nearest stored regimes.

```python
codebook = np.stack([e["regime_vector"] for e in regime_entries])   # shape (N, D)

def recall(facts_now, k=3):
    v = encode_regime(facts_now)
    idx, sims = vsa.cleanup(v, codebook, k=k)        # ONE matvec + top-k; sims are cosines
    return [(regime_entries[i]["id"], float(s)) for i, s in zip(idx, sims)]

# operator loop: "what regime is this most like, and how confident?"
hits = recall({"rates": "rising", "vol": "high", "trend": "down"}, k=3)
```

From the recalled regime ids, follow `caused_by` / `derived_from` edges to the strategies that
**worked** there, the results, and — critically — the **autopsies** of what **died** there.

---

## 4. The FAILURE DATABASE (the moat)

The world publishes its winners. We index our **dead**. An `autopsy` entry's `content` is five fields:

| field | the question it answers |
|---|---|
| `cause_of_death` | what proximately killed it (costs ate the edge, leverage cap, regime flip) |
| `regime_that_broke_it` | which regime — linked to a `regime` entry by a `caused_by` edge |
| `the_lie_the_backtest_told` | how the backtest flattered (look-ahead, survivorship, in-sample fit, capacity fantasy, multiple-testing) |
| `what_was_assumed` | the silent regime/data assumption that failed |
| `the_revision` | what the operator changed next — linked to the revised `strategy` |

**Why it's the moat.** Strategies are copyable; the *graveyard* is not. A new strategy, before it
ships, queries the failure database at its own regime address: *"who died here, and of what?"* That
turns every past death into a guardrail. The autopsy is also a **first-class HUMANITIK contribution** —
filing an honest autopsy earns attribution, exactly like a winning strategy does. This aligns the
incentive with honesty, which is the success metric of the whole OS.

This wires directly to PLAN.md's methodology: *"every variant tested is logged to the failure database
— no silent discards."* The index is where that log lives.

---

## 5. Research methodology + the capacity-envelope discipline

### How research and sources enter

1. A `source` entry (paper/dataset/URL/DOI, with license + accessed date) is captured.
2. A reader distills it into a `lesson` (a `claim` + `evidence_links` + `confidence`).
3. The lesson is **encoded at the regime it pertains to** (`encode_regime`) so it is retrievable by
   regime, not just by keyword. A lesson about 2022-style rates-up/risk-off is addressed *there*.
4. Edges (`cites`, `supports`, `refutes`) wire it into the graph.

### The operator loop reads the index as MEMORY

The loop is **state → action → feedback → revision**. The index supplies the memory at the *state* step:

```
state    : observe today's facts -> encode_regime(facts)
recall   : vsa.cleanup -> nearest historical regimes (top-k, with confidence sims)
read     : follow edges -> what WORKED here (strategies/results) and what DIED here (autopsies)
action   : compile / pick a StrategyObject informed by that memory
feedback : run the court (walk-forward, costs, leakage guard) -> a result entry
revision : on death, file an AUTOPSY -> the memory is now richer for next time
```

### "Store factors, not items" — and REPORT the wall

The substrate is **abelian** (`bind` commutes) and has a **measured CAPACITY ENVELOPE**: at `D=128`,
recall is reliable to roughly `vocab≈24` at `depth≈10`; beyond that, **`bundle` superposition crosstalk
crashes recall**. The design rule that falls out: encode a regime from a **few orthogonal factors**, not
many entangled ones. Concretely:

- **Cap factors per bundle.** `FACTOR_CAP` (a small number, found empirically by the degradation test
  below) is the maximum `feature:level` pairs per regime vector. `encode_regime` asserts it.
- **Factors, not items.** Don't bundle 50 individual observations into one vector; bundle the handful of
  orthogonal regime *factors* (rates / vol / trend / liquidity) the observations imply.
- **REPORT the wall.** The index's self-test emits a recall-degradation curve vs. `#factors` and names
  the count where `cleanup` recall drops below threshold. We publish the wall, we don't hide it — same
  posture as PLAN.md Arc 2: *"report the feature-count where bundle crosstalk breaks recall."*

The ordered, non-abelian work (selection→allocation→timing→risk) stays in the **operator layer**
(`strategy_object.py`), never in the abelian VSA substrate. The index addresses by regime; it does not
sequence.

---

## 6. The public-commons ⟂ `.local` split (Article 0)

Two stores, one schema, one mechanical gate:

- **Commons (public)** — de-identified, attributed entries. The shared moat.
- **`.local` (private)** — hard-gitignored, **unpublishable by any channel**.

**Every export routes through `foundation/privacy/publish_guard.py`.** A constitutional rule unenforced
in code is a prayer (Article 0.3).

```python
from foundation.privacy import publish_guard

def export_to_commons(entry, sink):
    # is_publishable() returns False on any `.local` token or PRIVATE:: marker
    return publish_guard.publish(entry, sink)        # raises PermissionError if local-derived
```

- An entry with `provenance: "local"`, or any `.local` path token, or a `PRIVATE::` tag is refused —
  `is_publishable` is `False`, `publish` raises. Default-safe: when unsure, it stays local.
- **De-identified contributions only.** `contributor` is a de-identified handle, never a name/email.

**Attribution ledger (HUMANITIK).** Each entry credits its `contributor` / `co_contributors`. When a
new entry cites/reuses an entry (a `cites`/`derived_from`/`revises` edge), the cited entry's
`attribution_count` increments — the reward signal. Autopsies count: an honest death earns credit.

---

## 7. Phased build plan — with E2E tests for the index

Same cadence as PLAN.md: each phase ships something that **runs and refutes**, offline, gated by a test.
Builds on Arc 2 (the regime layer) and Arc 4 (commons + privacy spine).

### Phase I — encode/store/retrieve round-trip
**Build:** `encode_regime`, the regime codebook, `recall` (cleanup top-k), the entry writer.
- **E2E test — round-trip recall ≥ threshold.** Encode N distinct regimes; for each, re-encode (with a
  little phase noise) and assert `cleanup` returns the *same* regime as the top hit with
  `similarity ≥ τ` (e.g. `τ=0.6`) on ≥ 90% of N. Mirrors `vsa.selftest`'s `cleanup recovered #k`.

### Phase II — find and REPORT the bundle wall
**Build:** the capacity-envelope self-test; set `FACTOR_CAP`.
- **E2E test — recall degradation curve vs. #factors.** Sweep factors-per-regime `1..M`; plot/emit mean
  top-1 recall; **assert recall is monotone-ish down and NAME the `#factors` where it crosses below `τ`**.
  That crossing *is* `FACTOR_CAP`. The test FAILS if the report omits the wall. (PLAN.md Arc 2 contract.)

### Phase III — the failure database
**Build:** the `autopsy` kind + its edges; the regime→strategy/result/autopsy traversal.
- **E2E test — autopsy round-trip.** File ≥ 1 autopsy with all five fields and a `caused_by` regime edge
  and a `revises` strategy edge; assert that `recall(regime)` → follow edges → returns that autopsy. The
  graveyard is reachable from the regime that dug it.

### Phase IV — privacy spine: 0 leaks
**Build:** the commons exporter wrapping `publish_guard.publish`.
- **E2E test — 0 `.local` leaks across 100 commons exports.** Fuzz 100 entries (some seeded with `.local`
  tokens / `PRIVATE::` tags); assert **zero** local-derived entries reach the sink and each raises
  `PermissionError`. Directly mirrors Article 0.2's guard test and PLAN.md Arc 4.

### Phase V — attribution tally
**Build:** the HUMANITIK ledger + the citing-edge counter.
- **E2E test — 3-contributor fixture.** Three contributors file entries; some cite others; assert each
  `attribution_count` equals the exact number of incoming citing edges, and autopsies count. (PLAN.md
  Arc 3: *"≥ 3 attributed index entries; ≥ 1 autopsy"*; Arc 4: *"ledger tallies in a 3-contributor fixture."*)

**Green looks like:** round-trip recall ≥ τ on N regimes · the bundle wall named in the report ·
the failure database reachable by regime · 0 `.local` leaks / 100 exports · the attribution tally exact ·
zero network, the whole way down.
