# Node 02 — Regime: the FHRR torus kernel, store factors not items

> **TR** — Rejim katmanı: beş VSA ilkesi üzerine kurulu FHRR torus çekirdeği; "hangi rejim"
> sorusunun **değişmeli** betimini tutar. Kapasite zarfına uyar: öğeleri değil çarpanları sakla.
> *(Türkçe önce gelir.)*
>
> **EN** — The regime layer: the FHRR torus kernel over five VSA primitives; it holds the
> **commutative** "what regime" description. It respects the capacity envelope: store factors, not
> items.
>
> **ZH** — 机制层：建立在五个 VSA 原语之上的 FHRR 环面内核；持有"何种机制"问题的**交换式**描述。
> 它尊重容量包络：存因子，而非存条目。

**Status: REGIME SUBSTRATE** · `foundation/kernel/vsa.py` (+ future `foundation/regime/` JEPA-lite).

The regime layer answers one question — *what regime am I in?* — and answers it as a **description**,
not a prediction. An FHRR hypervector is `D` complex numbers, each on the unit circle; the information
is in the **phases**. The whole substrate is five primitives (numpy complex64, unit-modulus):

```
rand_hv(D, rng)    a fresh concept = random angles
bind(a, b)         = a * b            role↔filler ("color IS red"); phases ADD; COMMUTATIVE
unbind(c, b)       = c * conj(b)      bind is invertible
bundle(vs)         normalized Σ       superposition (a set / a memory) — the CAPACITY wall lives here
permute(v, shift)  = roll(v, shift)   protect order / sequence position
similarity(a, b)   mean cos(Δphase)   how aligned two memories are (cosine)
cleanup(v, book,k) one matvec + top-k snap noise to the nearest clean concept(s)
```

**Why the regime is commutative — and must stay so.** "What regime is this" is a *set*: you
`bind(feature, level)` for each observable, then `bundle(...)` them into one regime hypervector. Both
`bind` and `bundle` are order-free (`a*b == b*a`), which is exactly the substrate's native, **untaxed**
lane. The ordered pipeline (selection→allocation→timing→risk) is *not* order-free, so it is kept out
of here and lifted into the operator (node 01). The regime layer holds the commutative content, and
only the commutative content. This split is the architecture.

**The capacity envelope — store factors, not items.** This is a **measured** wall: at `D=128` the
substrate holds roughly `vocab≈24 @ depth=10`, and past that `bundle` crosstalk crashes recall. The
discipline that follows is "store **factors** not items": bind a few `feature:level` *factors* and
bundle a small set, rather than bundling many whole items. A regime is recalled by `cleanup` against a
small codebook, and the regime arc is required to **report the feature-count where bundle crosstalk
breaks recall** rather than paper over it with more dimensions. (Companion walls: `seq_len≈256`, so
history is summarized to a regime hypervector, not fed as one long sequence.)

On top of this sits a numpy **JEPA-lite** transition predictor — `regime_t → regime_{t+1}` in latent
space — the only forward-looking part of the layer, and even it predicts *regime transitions*, never
prices. The regime description it produces feeds the operator's next compose, closing the loop.
