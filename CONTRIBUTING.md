# Contributing — the common constitution

The charter, in the three bootstrap languages (Turkish first — the bridge between English and
Chinese):

> **TR** — Burada en güçlü itiraz kazanır; çürütülen bir fikir bir yenilgi değil, bir sonuçtur.
> **EN** — Here the strongest objection wins; a refuted idea is a result, not a defeat.
> **ZH** — 在这里，最有力的反驳获胜；一个被驳倒的想法是一项成果，而非失败。

---

## Article 0 — the eternity clause (RATIFIED · non-amendable · non-proposable)

These four rules are the constitution's first node. They are **not** Ethics Decision Records;
they are outside the forum's jurisdiction and cannot be deliberated, weakened, or removed.

> **TR**
> 1. `.local` sıkı biçimde gitignore'lanır.
> 2. `.local` yayımlanamaz.
> 3. Yayımlanamazlık gitignore'lanamaz.
> 4. Yayımlanamazlık maddesinin **kaldırılması teklif dahi edilemez**.
>
> **EN**
> 1. `.local` is hard-gitignored.
> 2. `.local` is unpublishable.
> 3. Unpublishability is ungitignorable.
> 4. The **removal** of the unpublishability clause **cannot even be proposed**.
>
> **ZH**
> 1. `.local` 被硬性 gitignore（永不提交）。
> 2. `.local` 不可发布。
> 3. “不可发布性”不可被 gitignore（其保障机制不可移除或隐藏）。
> 4. **废除**“不可发布性”条款一事，**甚至不得被提案**。

Full text, the recursive lock, and the four guards: [`foundation/constitution/00-eternity-clause.md`](foundation/constitution/00-eternity-clause.md).

## Everything else is deliberated — the ESG body

The rest of the constitution is **amendable**, via **Ethics Decision Records (EDRs)** debated in
the forum (see [`FORUM.md`](FORUM.md)):

- **E — Environmental** · footprint · local-first · efficiency-as-ecology
- **S — Social** · the commons · **HUMANITIK** attribution & reward · trilingual access
- **G — Governance** · forum process · safety · how we amend (everything *except* Article 0)

## How contribution works

1. Bring a **de-identified** question, lesson, or failure-autopsy — **never** a `.local` position.
2. Deliberate in the forum; the strongest objection prevails (refutation ethos).
3. On ratification, a maintainer writes/updates the EDR node and **credits you** in the
   attribution ledger (HUMANITIK). Contributions count and are rewarded.

`.local` never enters the commons. The boundary is enforced in code (`foundation/privacy/publish_guard.py`),
not by trust.

**Not public until notice.** No push, no GitHub, no remote.
