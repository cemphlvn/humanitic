# Node — Unsupervised Edge (causality + dynamic regime trading)

> **TR** — Etiketsiz öğrenme rejimleri KEŞFEDER (k-means), bunları atom olarak madenleştirir ve DİNAMİK
> olarak (ileri-yürüyüş, 1 adım ileri) işler. Zaman-serisi NEDENSELLİĞİ (Granger) + sermaye-büyüme
> mahkemesi birlikte yargılar. Gerçek bir kenar için bir DENEME — çoğu deneme dürüstçe başarısız olmalı.
> **EN** — Unsupervised learning DISCOVERS regimes (k-means, no labels), mines them as atoms, and trades
> them DYNAMICALLY (walk-forward, 1-step-ahead). Time-series CAUSALITY (Granger) + the capital-growth
> court judge it together. A thought attempt at a real edge — most attempts should fail honestly.
> **ZH** — 无监督学习发现机制（k-means，无标签），将其挖掘为原子，并动态地（前向、提前一步）交易。
> 时间序列因果性（Granger）+ 资本增长法庭共同裁决。一次对真实优势的尝试——多数尝试应诚实地失败。

**Status:** ADOPTED. Code: `foundation/regime/unsupervised.py` · `foundation/eval/causality.py`.
Run: `./run.sh edge`.

## The pipeline (the answer to the seasonal confound)
The capital-growth court caught the raw periodic signal as a seasonal confound. The response: don't trade
the cycle — **discover regimes and predict the next-period return**.
1. **Discover** — k-means (numpy, no labels) finds regimes in a feature space, refit walk-forward on the
   PAST only.
2. **Mine atoms** — each discovered regime → its learned mean NEXT return (`regime(X[i]) -> r[i+1]`).
3. **Trade dynamically** — assign the current state to a regime, take the position, earn `r[t+1]`. Causal
   by construction (fit on `[:t]`, earn `r[t+1]`) — a genuine 1-step-ahead forecast.
4. **Judge twice** — the **statistical court** (Newey-West t / block bootstrap / min-shift permutation) AND
   a **Granger-causality** screen (does the feature's past predict the return beyond its own past?).

## Measured (synthetic regime world with a real planted lag)
```
court:   MEANINGFUL   t=7.1  permutation_p=0.001  bootstrap_p=0.000
granger: CAUSES       F=13.6  p=0.002
noise control:        NOT MEANINGFUL  +  not Granger-causal
```
Both fire on a real lagged edge; **both stay silent on noise**. The court alone is fooled by seasonality;
Granger alone is fooled by autocorrelation — together they are a much stronger screen.

## Honest framing (refutation ethos)
This is a **thought attempt at finding an edge**, validated on a synthetic world with a *known* planted
lag. It proves the machinery detects a real, causal, regime-driven edge and rejects noise — it does **not**
claim a live edge. A genuine verdict needs real, **deseasonalized** data through the live pull. Most such
attempts should fail honestly; the value is a screen strict enough to let them.
