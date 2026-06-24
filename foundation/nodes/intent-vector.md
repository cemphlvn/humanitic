# Node — The Validated Intent Vector (what w_t is, and its ancestors)

> **TR** — `w_t` bir "niyet vektörü"dür: görüşün portföy geometrisine enjeksiyonu. Ama ham görüş değil —
> mahkeme, diklik, kapasite ve hayatta-kalmadan SAĞ ÇIKMIŞ görüş. En keskin adı: **Doğrulanmış Niyet
> Vektörü** (Court-Tested View Vector).
> **EN** — `w_t` is an "intent vector": the injection of a view into portfolio geometry. But not a raw
> view — a view that SURVIVED the court, orthogonality, capacity, and survival. Sharpest name: the
> **Validated Intent Vector** (a Court-Tested View Vector).
> **ZH** — `w_t` 是"意图向量"：把观点注入组合几何。但不是原始观点——而是经过法庭、正交性、容量与生存
> 检验后幸存的观点。最贴切的名字：**已验证意图向量**（经法庭检验的观点向量）。

**Status:** FOUNDATIONAL (owner-articulated). Names the macro-kernel's output `w_t`.

## The historical lineage (intent ≈ view ≈ alpha ≈ policy ≈ active-weight ≈ goal-direction)
| ancestor | contribution | ark's organ |
|---|---|---|
| **Markowitz 1952** (Portfolio Selection) | beliefs + risk geometry → portfolio weights | the weight vector `w_t` itself |
| **Kelly 1956** (Information Rate) | edge strength → bet size → growth | `allocator` fractional-Kelly sizing |
| **Black–Litterman 1992** (Global Portfolio Optimization) | market prior + **views** + confidence → weights | *intent injection* — the candidate edge as a view |
| **Grinold** (Fundamental Law) | `IR = IC·√breadth` — independent bets add | `EdgeBook` + `diversified_ir = √(ΣSharpe²)` |
| **White / Hansen / Bailey–López de Prado** | data-snooping → SPA → **Deflated Sharpe** | the **court** (`significance`, `deflated_sharpe`) |
| **Risk parity / HRP** (Maillard·Roncalli; López de Prado) | allocate by risk contribution + correlation structure | `allocator` risk-parity + `orthogonality` |
| **HRR / HDC / VSA** (Plate; Kanerva) | bind/bundle/superpose intent as vectors | the kernel: edge=binding, book=bundle, `w_t`=superposition |

## MECE map
- **A. Finance geometry** (Markowitz, Black–Litterman) → intent becomes weights.
- **B. Sizing** (Kelly) → edge strength becomes capital fraction.
- **C. Breadth** (Grinold) → independent bets add power.
- **D. Honesty** (White, Hansen, DSR) → punish fake discoveries.
- **E. Correlation/risk** (risk parity, HRP) → allocate by risk + orthogonality.
- **F. Cognitive vectors** (HRR, HDC, VSA) → bind/bundle/superpose intent.

## The clean sentence
> The Validated Intent Vector = a **Black–Litterman view** vector + a **Markowitz weight** vector +
> **Grinold breadth** + **Kelly sizing** + the **White/Hansen/DSR honesty court** + **HRR/HDC/VSA**
> symbolic binding — i.e. **a portfolio action vector produced from beliefs that survived statistical
> honesty, orthogonality, capacity, and survival.**

It is not a view. It is **a view that survived the court and became executable.** Every one of those six
families is now an organ in `foundation/`: the lineage is the architecture, and the architecture runs.
