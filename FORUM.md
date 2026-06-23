# FORUM — the ethics forum map

> **TR** — Etik forumu: GitHub Tartışmaları kategorileri ↔ EDR düğümleri ↔ onay döngüsü. En güçlü
> itiraz kazanır; çürütülen fikir bir sonuçtur, yenilgi değil. Madde 0 forumun dışındadır.
> *(Türkçe önce gelir.)*
>
> **EN** — The ethics forum: GitHub Discussions categories ↔ EDR nodes ↔ the ratification loop.
> The strongest objection wins; a refuted idea is a result, not a defeat. Article 0 is outside
> the forum.
>
> **ZH** — 伦理论坛：GitHub Discussions 分类 ↔ EDR 节点 ↔ 批准回路。最有力的反驳获胜；被驳倒的
> 想法是一项成果，而非失败。第 0 条在论坛管辖之外。

**Status: LOCAL · not public until notice.** No remote, no GitHub, no push. This file maps the
forum the project *will* deliberate in; today it is a design, not a live forum.

---

## What the forum is for

Everything in the constitution **except Article 0** is amendable, through **Ethics Decision Records
(EDRs)** debated in the open. Article 0 — the eternity clause — is **non-justiciable**: it cannot be
deliberated, weakened, removed, or even proposed against. The forum has no jurisdiction over it
(see `foundation/constitution/00-eternity-clause.md`, rule 0.4).

The forum deliberates the **ESG body**:

- **E — Environmental** · footprint · local-first · efficiency-as-ecology
- **S — Social** · the commons · HUMANITIK attribution & reward · trilingual access
- **G — Governance** · forum process · safety · how we amend (everything except Article 0)

---

## Discussions categories ↔ EDR nodes

```
  GitHub Discussions category        →   EDR node (constitution/)        status
  ─────────────────────────────────      ────────────────────────────   ───────────
  🌱 Environmental                    →   E-environmental.md             PROPOSED
  🤝 Social / HUMANITIK               →   S-social.md                    PROPOSED
  🏛  Governance                       →   G-governance.md                PROPOSED
  📓 Refutations / Autopsies          →   (feeds the failure DB; lessons → commons + attribution)
  🔒 Article 0                        →   00-eternity-clause.md          RATIFIED · non-justiciable
                                          (auto-closed if a thread proposes weakening it)
```

Each category maps to exactly one EDR node file under `foundation/constitution/`. A ratified
discussion becomes an edit to that node; an open discussion is a node still at status `PROPOSED`.

---

## The ratification loop

The forum runs the same loop the whole system runs — `state → action → feedback → revision` — but
over **values** instead of strategies. The governing ethic: **the strongest objection survives.**

```
   propose ──▶ deliberate ──▶ strongest objection ──▶ temperature-check ──▶ maintainer
   (a de-id    (open thread;   survives               poll (the room        ratifies the EDR
    EDR draft)  refutation-     (if it stands,         reads the consensus)  node + credits
                first)          the EDR is reshaped                          contributors via
                  │             or refuted)                                  HUMANITIK)
                  │                                                              │
                  └───────────────────◀── revise the draft ──────◀──────────────┘
                            a refuted proposal is a RESULT, filed and attributed
```

1. **Propose.** Bring a **de-identified** question, lesson, or failure-autopsy as an EDR draft —
   **never** a `.local` position (the publish guard refuses it anyway).
2. **Deliberate.** Open thread, refutation-first. We hunt for the *strongest objection*, not for
   agreement. A claim that survives the strongest objection earns its place.
3. **Strongest objection survives.** If the objection stands, the EDR is reshaped or refuted. A
   refuted EDR is a **result**, not a loss — it is filed and its lesson attributed.
4. **Temperature-check poll.** A lightweight read of the room's consensus — advisory, not binding;
   it informs the maintainer, it does not override the strongest objection.
5. **Maintainer ratifies.** A maintainer writes/updates the EDR node (`E`/`S`/`G`) and flips its
   status from `PROPOSED` to `RATIFIED`, **crediting every contributor** in the attribution ledger
   (HUMANITIK). Contributions count and are rewarded.

---

## What the forum may NOT touch

- **Article 0** — the eternity clause. Non-amendable, non-proposable, **non-justiciable**. Threads
  that propose weakening `.local` unpublishability are **auto-closed** (`reject_article0_proposals`,
  forum CI; rule 0.4). The forum cannot vote itself the power to open the lock.
- **`.local` contents** — never enter the forum. De-identify or do not bring it. The boundary is
  enforced in code (`foundation/privacy/publish_guard.py`), not by etiquette.

> The forum can change almost everything about how we work together. It cannot change the one thing
> that keeps a self-revising system trustworthy: that the private vault stays private, forever.
