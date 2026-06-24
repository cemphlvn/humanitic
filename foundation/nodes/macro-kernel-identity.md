# Node — What This Is (the macro-kernel's identity)

> **TR** — En yakın tanım: KAPASİTE-SINIRLI bir kenar-portföyü işletim sistemi. Bot değil, tek strateji
> değil, tek model değil. Birçok küçük kenarı keşfeden, doğrulayan, saklayan, birleştiren, boyutlandıran,
> izleyen ve emekli eden YAŞAYAN bir ağırlık vektörü. En iyi tek benzetme: bir hedge-fon BAĞIŞIKLIK sistemi.
> **EN** — The closest description: a CAPACITY-BOUNDED portfolio-of-edges operating system. Not a bot, not
> one strategy, not one model. A living weight vector that discovers, validates, stores, combines, sizes,
> monitors, and retires many small edges. Best single analogy: a hedge-fund IMMUNE SYSTEM.
> **ZH** — 最贴切的描述：一个容量受限的优势组合操作系统。不是机器人、不是单一策略、不是单一模型。一个活的
> 权重向量，发现、验证、存储、组合、定大小、监控并退役许多小优势。最佳类比：对冲基金的免疫系统。

**Status:** FOUNDATIONAL (owner-articulated). The conceptual identity behind `foundation/portfolio/`.

## The semantic formula
```
Macro Kernel = Discovery ⊗ Honesty ⊗ Orthogonality ⊗ Capacity ⊗ Allocation ⊗ Decay-Management
```
Human form: **find new edges · punish fake edges · keep only different edges · respect capacity · size the
survivors · kill what decays · repeat.** It is a **loop, not a pipeline.**

## It IS the VSA substrate (binding · bundling · superposition)
The portfolio-of-edges is not *like* the kernel — it *is* the kernel's own algebra:
- **Binding** — an edge is a bound object, not "a signal":
  `EDGE = signal ⊗ regime ⊗ asset_universe ⊗ validation_score ⊗ return_stream`
  (*what it sees × when it works × where it trades × how honest it is × what it produced*). This is the
  `Edge(source, returns, dsr, meta)` record.
- **Bundling** — the book accumulates admitted edges: `EDGEBOOK = edge₁ + edge₂ + … + edgeₙ`. A *good*
  bundle is diverse (low correlation); a bad one is many copies of the same hidden bet. This is `EdgeBook`
  + the orthogonality filter.
- **Superposition** — the weight vector holds many conditional opinions at once:
  `w_t = small(inflation) + small(AI-capex) + small(liquidity) + small(momentum) + small(defensive)`.
  The portfolio is not one opinion; it's a superposed book of conditional ones.
- **Capacity** — and because it's a bundle, `C(D)=0.386·D` caps how many edges superpose before cleanup
  fails. The conservation law is literally why the book is capacity-bounded.

## MECE analogy map (what it resembles, and where ark's version lands)
| domain | the similarity | ark's version |
|---|---|---|
| hedge-fund pod platform | many PMs → combined book → risk sizes capital | micro-edges → EdgeBook → allocator → `w_t` |
| venture studio | many experiments enter, few survive, capital reallocates | candidates → court → admit/kill → resize |
| scientific lab | hypotheses survive evidence + statistical punishment | edge → prequential/bootstrap/permutation/DSR → verdict |
| ensemble learning | weak predictors help only if errors aren't identical | edges help only if correlation-to-book is low |
| immune system | detect · tolerate · attack · retire · adapt | monitor decay · correlation drift · drawdown · regime failure |
| k8s scheduler | many workloads compete for bounded capacity | edges compete for book capacity + risk budget |
| ecological niches | species survive by occupying different niches | edges survive by occupying different regime/data niches |

## The closest single analogy — a hedge-fund immune system
Because it doesn't merely search for profit; it continuously asks of every edge:
**Is it real? Is it different? Is it still alive? Is it dangerous? Does it deserve capital? Should it be
retired?** That is the living portfolio-of-edges — realized in `foundation/portfolio/{edge_book,
orthogonality,allocator,monitor,loop}.py`, gated by the court, floored by survival.
