# HUMANITIK — the humane commons (attribution · reward · the failure database)

> **TR** — HUMANITIK, ortak aklın insani zeminidir: yerel bilgi indeksi + **başarısızlık
> veritabanı** + her katkıyı sayan ve ödüllendiren bir **atıf defteri**. Çürütülen bir fikir
> bir yenilgi değil, bir sonuçtur; ve burada her sonuç birine yazılır. İnsanlar makro
> stratejilerini bunun üzerine kurar — ve herkesin katkısı sayılır ve ödüllendirilir.
> *(Türkçe önce: İngilizce ile Çince arasındaki köprü.)*
>
> **EN** — HUMANITIK is the humane floor of the commons: a local knowledge index + the
> **failure database** + an **attribution ledger** that counts and rewards every contribution.
> A refuted idea is a result, not a defeat — and here every result is credited to someone.
> People build their macro strategies on this, and everyone's contributions are rewarded and
> count, with HUMANITIK.
>
> **ZH** — HUMANITIK 是共域的人本基座：本地知识索引 + **失败数据库** + 一本为每一份贡献
> 计数并给予回报的**署名账本**。被驳倒的想法是成果，而非失败——在这里，每一项成果都归于某人。
> 人们在它之上构建宏观策略，而每个人的贡献都被计数、被回报，因 HUMANITIK 而成立。

**Status: a first-class node · the Commons layer (4 of 5) · the moat.** Bound to the **ESG-Social**
EDR and the ethics forum; bounded by **Article 0** (the eternity clause). Not public until notice.

---

## What HUMANITIK is

The other four layers make a strategy *runnable and refutable*; HUMANITIK makes the **lessons
durable and the people visible**. It is the commons that remembers — and the only layer whose
job is to attribute. A market mechanism that forgets *why a strategy died* repeats the death;
a commons that forgets *who found the refutation* erases the contributor. HUMANITIK refuses both.

It productizes the lab's refutation ethos: the same instinct that makes the LABNOTES try to break
their own claims becomes, here, a **failure database** anyone can query before they repeat a known
mistake — with every entry credited.

## The acronym — 9 invariants, each with a measurable bar

| | Principle | The bar (measured, not asserted) |
|---|---|---|
| **H** | **Honest evidence** | leakage catch = **100%** — `leakage_guard` corrupts the future and refuses any peeker; OOS reported separately from IS |
| **U** | **User-owned privacy** | **0** `.local` leaks per 100 commons exports (`publish_guard` fuzz test) |
| **M** | **Measured limits** | every wall the lineage hit is *respected and reported* — TC⁰ depth ceiling, abelian-only regime, bundle-crosstalk capacity envelope, `seq_len≈256` |
| **A** | **Attribution rewarded** | **every** commons entry carries a `contributor` + a `count`; no anonymous orphans in the index |
| **N** | **Nodes open** | the public commons is readable & forkable in full; the split is `commons ⟂ .local` |
| **I** | **Indexed locally** | the index lives on this machine; no remote, no telemetry, query-able offline |
| **T** | **Trilingual bootstrap** | entries carry a TR→EN→ZH head so access is not gated by one language |
| **I** | **Iterative operator** | the commons itself runs state→action→feedback→revision; lessons are revised, not frozen |
| **K** | **Kernel-legible** | every entry is expressed in the four common codes (operator loop · VSA primitives · `w_t` contract · cost-aware walk-forward), so a reader can re-run it |

## What counts as a contribution

A **contribution** is any *de-identified* artifact that makes the next operator's loop better:

1. **An autopsy** — a strategy died in the evidence court; you filed *why* (the leak found, the
   regime that broke it, the cost that ate the edge). Autopsies are **first-class** — the failure
   database is the moat, so the people who fill it are the people the moat is built by.
2. **A lesson** — a generalizable finding extracted from one or more autopsies ("momentum sleeves
   decay through the 2-regime transition unless turnover-capped").
3. **A de-identified question** — a sharp question that seeds deliberation.
4. **A prevailing objection** — in the forum, the *strongest objection that survived* and reshaped
   an EDR. Refutation is contribution; the objector is credited like an author.
5. **An accepted answer / a verified replication** — answering a question, or re-running someone's
   backtest and confirming (or breaking) it.

What is **never** a contribution: a `.local` position, a private signal, anything with `.local`
provenance or a `PRIVATE::` tag. (See the privacy boundary below.)

## How the reward/count is computed — the attribution ledger

HUMANITIK keeps an **attribution ledger**: a local, append-only tally keyed by contributor. The
forum (LOCAL GitHub Discussions, not public) is the event source; the ledger **ingests forum
metadata** and turns it into a contribution count.

```
contribution_score(contributor) =
    Σ over their commons entries of weight(kind) × (1 + corroboration)

where, illustratively:
    weight(autopsy filed)            = highest   — the moat is built from these
    weight(prevailing objection)     = high      — refutation that reshaped an EDR
    weight(accepted answer)          = high      — forum metadata: marked "accepted"
    weight(verified replication)     = high      — someone re-ran it and it held/broke as filed
    weight(lesson generalized)       = medium
    weight(de-identified question)   = base
    corroboration = reactions + downstream citations of the entry (forum metadata)
```

Ingested forum signals: **who raised the objection that prevailed**, **whose answer was accepted**,
**reactions** on a thread, and **which EDR an entry shaped**. Every resulting index entry is written
with a `contributor` field and a running `count` — invariant **A** fails CI if any entry is an
anonymous orphan. The tally is *visible*: a contribution is not a private favor, it is a public,
counted, rewarded fact. (E2E gate, Arc 4: the ledger tallies contributions in a 3-contributor
fixture; 0 `.local` tokens across 100 exports.)

## The failure database as commons

The failure database is HUMANITIK's heart, not a graveyard. It remembers **why strategies died,
where backtests lied, and which regimes broke them**. Each autopsy is an entry — kernel-legible,
trilingual-headed, attributed. Querying it *before* you compile a `StrategyObject` is the cheapest
refutation available: someone already paid for this lesson, and they are credited for it. "A refuted
idea is a result, not a defeat" — operationalized as a searchable, attributed asset.

## The ESG-Social tie & the ethics-forum tie

HUMANITIK **is** the substance of the **S — Social** EDR: the commons, attribution & reward, and
trilingual access. It is amendable (an EDR deliberated in the forum) — *unlike* Article 0. The forum
is where contributions are *born* (deliberation → strongest objection survives → ratified EDR), and
HUMANITIK is where they are *recorded and rewarded*. Forum and ledger are one loop: deliberate →
ratify → credit → revise.

## The privacy boundary (Article 0)

**`.local` NEVER enters the commons.** Only de-identified questions, lessons, and autopsies are
publishable. This is not a guideline — it is enforced in code: every outbound path routes through
[`foundation/privacy/publish_guard.py`](../privacy/publish_guard.py), which refuses any artifact with
`.local` provenance or a `PRIVATE::` tag (Article 0.2), and the guard itself cannot be hidden
(Article 0.3). HUMANITIK opens the lessons to the world while the position that produced them stays
yours. The commons is humane *because* the privacy spine is unbreakable.

## The vision

> Infrastructure people build their macro strategies on — and everyone's contributions are rewarded
> and count, with HUMANITIK.

See: [`00-eternity-clause`](../constitution/00-eternity-clause.md) ·
[`10-alignment`](10-alignment.md) · [`20-backtesting-ethics`](20-backtesting-ethics.md) ·
[`../privacy/publish_guard.py`](../privacy/publish_guard.py)
