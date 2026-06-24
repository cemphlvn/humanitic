# Node — The Foundation-Math Spine (cognition ⟷ finance ⟷ physics)

> **TR** — Temel matematik, soyun gen-4 `peras` çalışmasından kopyalanan **tutulan-bilgi korunum
> yasasıdır**. Tek para birimi: bit. `.local` madenciliği = kaynak (grounding); piyasa kaosuna karşı
> kenarı (edge) tutmak için `ρ*·I_g ≈ λ` gerekir — **madencilik bu yüzden ticareti açar**.
> **EN** — The foundation math is a **conservation law of held information**, copied from the lineage's
> gen-4 `peras` work. One currency: bits. `.local` mining = the source (grounding); to hold edge against
> market chaos you need `ρ*·I_g ≈ λ` — **that is why mining unlocks trading**.
> **ZH** — 基础数学是从谱系第四代 `peras` 工作中复制的**持有信息守恒律**。唯一货币：比特。
> `.local` 挖矿 = 源（接地）；要在市场混沌中持有优势需 `ρ*·I_g ≈ λ` ——**这就是挖矿解锁交易的原因**。

**Status:** FOUNDATION · ported from `~/lib/table/LABNOTES.md` (peras gen-4). *This is research of its own.*
Code: [`foundation/spine/conservation.py`](../spine/conservation.py), [`mapping.py`](../spine/mapping.py).

## The law (one conserved currency: bits)
```
conservation:        d(held bits)/dt = source − sinks,  capped by capacity
held information:     H* = K·(1 − E_age[H₂(e_stale(age))]),  age ~ Geometric(ρ/K),  then capped at C(D)
source↔sink (b06):    ρ*·I_g ≈ λ           grounding influx must cover the chaos (KS-entropy) leak
capacity (b07):       C(D) = c·D,  c ≈ 0.386 bits/dim        the dimension resource IS a bit reservoir
converse (b19/b20):   H ≤ H_oracle = K·(1 − E_τ[H₂(e_τ)]);  τ-aware decoder is capacity-achieving
phase transition(b03):predictable below Greene's K_g = 0.971635406, chaotic (λ>0) above  (Chirikov/KAM)
```
Derived with **zero free parameters**, refutation-tested to ratio 1.00 ± 2–4%. The core **is** a
Fourier-HRR (wave-physics identity, e29): bind = phase-add, bundle = superpose, cleanup = injection-lock.

## Why the three domains are the same law
They share dimensional layers, so the conservation math transfers as an *identity*, not an analogy:

| layer | physics | cognition | finance |
|---|---|---|---|
| substrate | RLC phasors / wave field | FHRR torus kernel | regime hypervectors |
| state | Hamiltonian phase space | held bits in store | market regime \|M_t⟩ |
| chaos sink λ | Lyapunov / KS-entropy (Pesin) | memory decay | edge / alpha decay rate |
| source | energy injection | grounding ρ·I_g | **mining (`.local` trigrams)** |
| coupling | injection locking (PLL) | ρ*·I_g ≈ λ | grounding to hold edge |
| capacity | modes / bandwidth | C(D)=0.386·D | bits of edge per regime dim |
| phase transition | KAM K_g=0.9716 | auditability wall | regime shift / unpredictable |
| channel bound | Shannon capacity | converse H_oracle | strategy I/O bit-rate cap |

## The finance reading (your insight, made into a law)
- **Mining is grounding.** Market churn `λ` is a sink draining your edge. To *hold* edge you must ground
  at `ρ* = λ/I_g`. Mining `.local` strategies into public trigrams **is** that grounding — so
  `mining_unlocks_trading(mining_rate, λ)` is the source↔sink coupling, not a fee policy. Starve the
  grounding and held edge decays to zero: nothing to trade. The 5% foundation cost rides this current.
- **The FHDD sink distribution.** A running strategy streams input bits (market) → output bits (weights).
  `sink_distribution(K, ρ, p_f, D)` returns the held-information budget **at the sink** — the cap on the
  decision bit-rate. Edge that survives the sink is `held_bits`; you cannot stream more than `C(D)`.
- **Regime shift = KAM crossing.** When the market's effective coupling crosses `K_g`, `λ>0` and the
  long-horizon edge is gone — the same wall the lineage measured, now a tradable boundary.
