# EDR · E — Environmental

> **TR** — Çevresel: ayak izi, yerel-öncelik, ekoloji olarak verimlilik. Küçük çalışan, gerçek
> çalışandır. *(Türkçe önce gelir — İngilizce ile Çince arasındaki köprü.)*
>
> **EN** — Environmental: footprint, local-first, efficiency-as-ecology. What runs small, runs real.
>
> **ZH** — 环境：足迹、本地优先、以效率为生态。能在小处跑通的，才是真正跑通的。

**Status: PROPOSED** · EDR (amendable in the forum; see `FORUM.md`). *Not Article 0.*

This EDR proposes that ARK treat compute footprint as a first-class ethical constraint, not an
afterthought. The whole floor is built to run **offline on one Mac, numpy-only** — no cluster, no
network, no credentials. That is not merely a convenience; it is a position. Efficiency is treated
as ecology: the cheaper a result is to reproduce, the more honest and the more shareable it is. The
lineage walls (`D=128`, `seq_len≈256`, "store factors not items") point the same way — they reward
small, dense representations over brute scale, and the regime substrate is sized to respect them.

Concretely, this EDR would commit the project to: prefer deterministic, seeded, single-machine
reproductions over large runs; report the capacity envelope rather than papering over it with more
dimensions; and prefer the smallest model/representation that survives the evidence court. A result
that only reproduces on a data center is, by this EDR, a weaker result than one that reproduces on a
laptop. Refinements, counter-proposals, and the strongest objections are deliberated in the forum;
ratification credits contributors via HUMANITIK.
