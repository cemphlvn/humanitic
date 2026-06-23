# VAULTS — two vaults, one principle

> **TR** — İki kasa: açık ortak alan (paylaşılır, atfedilir) ile `.local` özel kasa (sistem yazar,
> Madde 0 korur). Sınır kodla çizilir, güvenle değil. *(Türkçe önce gelir.)*
>
> **EN** — Two vaults: the open commons (shared, attributed) and the `.local` private vault
> (system-written, protected by Article 0). The boundary is drawn in code, not in trust.
>
> **ZH** — 两个保险库：开放的公共仓（共享、署名）与 `.local` 私有仓（由系统写入，受第 0 条保护）。
> 边界由代码划定，而非靠信任。

**Status: LIVING MAP** · the boundary is enforced by `foundation/privacy/publish_guard.py`.
Not public until notice.

> This is the same pattern the author already runs in `~/lib/table/fashion/VAULTS.md` (a public
> vault ⟂ a private vault). Here the public vault is the **constitutional commons** and the private
> vault is **`.local`** under the eternity clause — open-core honesty applied to a macro-strategy OS.

---

## The two vaults

```
  ┌──────────────────────────────────┐        ┌──────────────────────────────────┐
  │  OPEN COMMONS — the public vault  │   ⟂    │  .local — the PRIVATE vault       │
  ├──────────────────────────────────┤        ├──────────────────────────────────┤
  │  foundation/**   tests/**   *.md  │        │  live positions & weights w_t     │
  │  the kernel, the court, the nodes │        │  identities, credentials, P&L     │
  │  de-identified lessons & autopsies│        │  un-anonymized market params      │
  │  attribution ledger (who learned  │        │  anything tagged PRIVATE::        │
  │   what) — HUMANITIK                │        │                                   │
  ├──────────────────────────────────┤        ├──────────────────────────────────┤
  │  committable · attributed · shared│        │  system-written · never leaves    │
  │  flows OUT only via publish()     │        │  the Mac · hard-gitignored        │
  └──────────────────────────────────┘        └──────────────────────────────────┘
        contribute upward what is common               keep what is yours
```

- **Open commons — the public vault.** Dependency-free, deterministic, readable. The shared floor:
  the five VSA primitives, the weight-vector contract, the evidence court, the constitution and the
  architecture nodes, plus **de-identified** lessons and failure-autopsies and the attribution ledger
  (HUMANITIK — who learned what). Anyone may read it, build on it, and contribute back.
- **`.local` — the private vault.** *System-written.* It holds the value that is yours to keep: live
  positions and the realized weight vectors `w_t`, identities, credentials, and any
  un-anonymized parameters. It **never** leaves the machine. It is governed by **Article 0**, the
  eternity clause — see `foundation/constitution/00-eternity-clause.md`.

---

## The principle: contribute while keeping what is yours

The two vaults make the project honest the same way open-core does. You strengthen the **commons**
(better primitives, a sharper court, a richer failure database) **because** it makes your private
operation better — and your private vault stays private. There is no tax on self-interest:
improving the commons and running your own strategies are the same motion.

- **Public ← contributions:** de-identified questions, lessons, failure-autopsies, translations,
  fixes — flow to the commons through the forum (see `FORUM.md`) and are credited in HUMANITIK.
- **Private ← value:** live positions, P&L, identities, un-anonymized params — stay in `.local`.
- **The boundary is the guard line.** `publish()` is the only sanctioned outbound path; it refuses
  any artifact carrying a `.local` token or a `PRIVATE::` tag.

---

## How the boundary is enforced (not by trust)

```python
from foundation.privacy import publish_guard

publish_guard.is_publishable("buy energy on the AI-capex thesis")  # True  → commons
publish_guard.is_publishable(".local/positions.json")              # False → blocked
publish_guard.publish(artifact, sink)   # the ONLY sanctioned outbound path; raises on .local
```

| Vault crossing | Allowed? | Mechanism |
|---|---|---|
| commons → commit | yes | normal git; nothing private is here |
| `.local` → commit | **no** | `.gitignore` hard entry (Article 0.1) |
| `.local` → any export/log/forum/telemetry | **no** | `publish_guard` refuses it (Article 0.2) |
| commons → `.local` (system writes private state) | yes | one-way; the system writes, never publishes |
| delete the guard to sneak data out | **no** | meta-test `guard_is_present` goes red (Article 0.3) |
| propose removing the boundary | **no** | outside the forum's jurisdiction (Article 0.4) |

The arrows go **out** of the commons and **into** `.local` — never the reverse across the publish
line. That one-way valve, enforced in code and locked by Article 0, is the whole privacy model.

## Many nodes (future arc)

Many private `.local` vaults can run against one shared commons at once. They would coordinate by
exchanging only **de-identified lessons and attribution** — never the contents of any `.local` —
exactly as the eternity clause requires. Named here as direction; not built yet.
