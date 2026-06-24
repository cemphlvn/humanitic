# Node — The Core Seam (cross-trading embedding topologies)

> **TR** — Farklı gömme modellerinin farklı yerel topolojileri vardır. Tek bir rejim uzayına
> (ortogonal Procrustes) hizalandığında, UZLAŞMALARI sağlam sinyal, ANLAŞMAZLIKLARI — dikiş (seam) —
> bilgidir. Topoloji topluluğunu piyasaya karşı çapraz işleriz: uzlaşıyla konumlan, ıraksamayla küçült.
> **EN** — Different embedding models have different native topologies. Aligned to one regime space
> (orthogonal Procrustes), their AGREEMENT is robust signal and their DISAGREEMENT — the seam — is
> information. We cross-trade the ensemble of topologies against the market: position by consensus,
> shrink by divergence.
> **ZH** — 不同的嵌入模型具有不同的原生拓扑。对齐到同一市场机制空间（正交 Procrustes）后，它们的
> **一致**是稳健信号，**分歧**——接缝（seam）——是信息。我们用拓扑集成对市场进行交叉交易：以共识
> 持仓，以分歧收缩。

**Status:** PROPOSED · EDR. Code: [`foundation/regime/cross_seam.py`](../regime/cross_seam.py).

## The mechanism
1. Take N embedding models, each with its own native latent topology (a different geometry).
2. Align each to the shared regime space with **orthogonal Procrustes** (the survey-validated,
   geometry-preserving best practice — `latent-space-survey-2026`).
3. For a market event, each model votes a regime. **Consensus** = the modal vote; **agreement** = the
   modal fraction; **the seam (divergence)** = `1 − agreement`.
4. **Cross-trade:** take the consensus regime's direction, **size by agreement**, shrink toward zero
   as the seam widens. Conservative — capped, never over-exposed when the topologies disagree.

## Why it's the seam
The **Platonic Representation Hypothesis** says good models converge to a shared structure, so a rigid
rotation aligns them — which means the **residual after alignment is exactly where the topologies
disagree.** That residual is both the *risk* (don't bet big through a wide seam) and the *alpha* (a
persistent seam is a tradable structural signal). The ensemble of topologies beats any single one:
`test_cross_seam` shows consensus accuracy exceeding the average single-model accuracy.
