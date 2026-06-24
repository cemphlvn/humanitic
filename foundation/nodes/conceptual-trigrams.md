# Node — Conceptual Trigrams & Cultural Cartography

> **TR** — `.local`'teki stratejiler, üç kavramlı **trigramlar** olarak temsil edilir. Katkı ve
> madencilik **kültürel kartografı** ödüllendirir; **%5 vakıf maliyeti** açık çekirdeği fonlar.
> Bir **prob**, anlamsal uzaylardan tek bir birleştirici kavramsal topolojiye haritalar.
> **EN** — Strategies in `.local` are represented as three-concept **trigrams**. Contributing and
> mining reward the **cultural cartographer**; a **5% foundation cost** funds the open core. A
> **probe** maps from semantic spaces to one unifying conceptual topology.
> **ZH** — `.local` 中的策略以三概念**卦象（trigram）**表示。贡献与挖掘奖励**文化制图者**；
> **5% 基金会成本**资助开放内核。一个**探针**将语义空间映射到统一的概念拓扑。

**Status:** PROPOSED · EDR (amendable). **Floor:** Article 0 (the eternity clause) is inviolable here.

## The representation
A strategy's private body stays in `.local`. What it contributes is a **trigram** — an ordered
triple of concepts from a *public* vocabulary, encoded as one FHRR hypervector
(`bundle(bind(pos_i, concept_i))`, see `foundation/index/trigram.py`). Three lines, I-Ching-resonant;
the public coordinate of a private strategy.

## Why this does not breach Article 0
The trigram is **lossy and non-invertible**: three bound concepts cannot reconstruct positions or
logic. It is a **new public object — a conceptual coordinate — not "published `.local`."** It carries
only public-vocabulary tokens and is checked by `publish_guard` before it can exist. The **probe** is
the single sanctioned crossing (semantic → public concepts); it *de-identifies by projection*.

> **The risk, named:** re-identification. If the vocabulary were too fine or the probe too faithful,
> a trigram could leak. So **"is this probe non-invertible enough?" is an EDR** — deliberated, with
> Article 0 as the floor that no deliberation may lower.

## The economy (privacy-bounded by construction)
Mining/contributing pays the **cultural cartographer** in proportion to **novelty** — how much *new*
conceptual territory the trigram charts, measured in the public topology — minus a **5% foundation
cost** (`FOUNDATION_COST = 0.05`). Because reward tracks novelty *in the public map*, a more-revealing
trigram is **never** worth more than a properly-abstracted one: the economy cannot bribe its way past
privacy. This is the HUMANITIK attribution ledger's value function. See [`HUMANITIK.md`](HUMANITIK.md).

## The unifying conceptual topology
All trigrams live on one FHRR manifold. The probe pulls **TR / EN / ZH** (and any embedding's)
expressions of the same idea into the same region — that cross-lingual collapse is what makes the
topology *unifying*, and it is the same VSA substrate the lineage already runs. The cartographer's
map is the commons' shared chart of market concepts.
