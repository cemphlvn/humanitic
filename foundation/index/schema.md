# İndeks Şeması · Index Schema · 索引模式

> **TR** — Yerel bilgi indeksinin somut giriş şeması ve OTOPSİ şeması. Her giriş bir
> FHRR rejim vektörü taşır; her giriş `public` ya da `local` kaynaklı (provenance) işaretlenir.
> Atfetme (attribution) alanları HUMANITIK içindir. Otopsiler birinci-sınıf katkılardır.
>
> **EN** — The concrete entry schema and the AUTOPSY schema for the local knowledge index.
> Every entry carries an FHRR regime vector; every entry is stamped `public` or `local`
> provenance. The attribution fields feed HUMANITIK. Autopsies are first-class contributions.
>
> **ZH** — 本地知识索引的具体条目模式与"尸检"（失败剖析）模式。每条条目都携带一个 FHRR 制度向量；
> 每条条目都标注 `public` 或 `local` 来源（provenance）。归因字段服务于 HUMANITIK。失败剖析是一等公民贡献。

---

## 1. The seven kinds an entry can be

The index is a single typed store. `kind` discriminates the payload.

| `kind` | holds | typical `content` keys |
|---|---|---|
| `regime` | a named market regime (a recall anchor) | `name`, `features` (dict feature→level), `period`, `notes` |
| `strategy` | a `StrategyObject` snapshot (de-identified) | `thesis`, `selection/allocation/timing/risk` (names + params), `data_sources`, `regime_assumptions` |
| `result` | a tear-sheet / validation outcome | `oos_sharpe`, `max_dd`, `turnover`, `per_regime`, `walk_forward` |
| `lesson` | a distilled, reusable finding | `claim`, `evidence_links`, `confidence` |
| `autopsy` | a FAILURE autopsy (the moat) — see §3 | the five autopsy fields below |
| `thesis` | a standalone macro thesis | `statement`, `mechanism`, `falsifier` |
| `source` | a citation / dataset / paper | `title`, `author`, `url_or_doi`, `accessed`, `license` |

---

## 2. The entry schema

JSON-ish. Field order is documentation, not enforcement.

```jsonc
{
  "id":            "str",          // stable, content-addressed: e.g. "autopsy:9f2c1a"
  "kind":          "regime | strategy | result | lesson | autopsy | thesis | source",
  "content":       { },           // kind-specific payload (table in §1)

  // --- the regime address: how this entry is FOUND ---
  "regime_vector": "complex64[D]", // FHRR hypervector, D=128 default (the kernel's measured D)
                                   //   built by encode() in RESEARCH-AND-INDEXING.md §3
  "regime_factors":["str"],        // the named factors bundled in (≤ FACTOR_CAP — the recall wall)

  // --- provenance: the public/.local split (Article 0) ---
  "provenance":    "public | local",   // local entries NEVER leave the machine
  "private_tags":  ["str"],            // free PRIVATE:: markers; presence forces provenance=local

  // --- HUMANITIK attribution ledger ---
  "contributor":      "str",       // de-identified handle of the first author
  "co_contributors":  ["str"],     // additional credited handles
  "attribution_count":0,           // times this entry was cited/reused by another entry (reward signal)

  // --- the graph: edges to other entries ---
  "links": [
    { "to": "<entry id>", "rel": "revises | refutes | supports | caused_by | derived_from | cites" }
  ],

  // --- bookkeeping ---
  "created":   "ISO-8601",
  "schema_v":  1
}
```

### Provenance is mechanical, not advisory

- `provenance: "local"` ⇒ the entry is gated by `foundation/privacy/publish_guard.py`. It is never
  serialized to the commons by any channel (export, forum, log, telemetry).
- An entry whose `content` or `private_tags` carries a `.local` path token or a `PRIVATE::` marker
  is **forced** to `provenance: "local"` at write time — `publish_guard.is_publishable(entry)` returns
  `False`, so the commons writer refuses it. The default-safe rule: when unsure, it stays local.
- Only `provenance: "public"`, de-identified entries enter the commons. The handle (`contributor`) is
  a de-identified label, never a real name/email.

---

## 3. The autopsy schema (the failure database — the moat)

An `autopsy` entry's `content` is exactly these five fields. This is what nobody else publishes:
not the strategies that worked, but **why strategies died, where backtests lied, which regimes broke them.**

```jsonc
{
  "cause_of_death":          "str",   // the proximate killer (e.g. "turnover ate the edge after costs")
  "regime_that_broke_it":    "str",   // + link to the regime entry; e.g. "rates-up / risk-off, 2022-style"
  "the_lie_the_backtest_told":"str",  // the specific way the backtest flattered (look-ahead, survivorship,
                                      //   in-sample fit, capacity fantasy, multiple-testing)
  "what_was_assumed":        "str",   // the silent regime/data assumption that failed
  "the_revision":            "str"    // what the operator loop changed next (links to the revised strategy)
}
```

Every `autopsy` SHOULD carry edges:
`caused_by` → the `regime` entry, `revises` → the prior `strategy`, `derived_from` → the `result`
tear-sheet that exposed the lie. An autopsy with no revision link is an open wound, not a lesson yet.

---

## 4. Field invariants (what the index writer asserts)

| invariant | check |
|---|---|
| every entry has a unit-modulus `regime_vector` of length `D` | `np.allclose(np.abs(v), 1.0, atol=1e-3)` |
| `len(regime_factors) ≤ FACTOR_CAP` | the bundle-wall discipline ("store factors not items") |
| a `local` entry is never publishable | `publish_guard.is_publishable(entry) is False` |
| a `public` entry has no `.local` / `PRIVATE::` | `publish_guard.is_publishable(entry) is True` |
| `attribution_count ≥ 0` and increments only on real citing edges | ledger reconciliation test |
| an `autopsy` has all five `content` fields, non-empty | schema validator |
