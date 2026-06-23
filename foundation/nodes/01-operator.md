# Node 01 — Operator: the agent loop carries depth + non-abelian composition

> **TR** — Operatör katmanı (GLM tarzı ajan-mühendis): derinliği TC⁰ tavanının ötesine taşır ve
> sıralı (değişmeli-olmayan) boru hattını yürütür — seçim→tahsis→zamanlama→risk. *(Türkçe önce
> gelir.)*
>
> **EN** — The operator layer (GLM-style agentic engineer) carries depth past the TC⁰ ceiling **and**
> runs the ordered, non-abelian pipeline — selection→allocation→timing→risk.
>
> **ZH** — 算子层（GLM 式的智能体工程师）将深度带到 TC⁰ 上限之外，并执行有序的（非交换的）流水线
> ——选择→配置→择时→风险。

**Status: BUILDER LAYER** · `foundation/operator/` + `foundation/kernel/strategy_object.py`.

The operator is the builder/operator: given a thesis and a regime description, it composes a
StrategyObject. Two **measured** lineage walls force the operator to exist as its own layer rather
than living inside the substrate.

**Depth past the TC⁰ ceiling.** The substrate cannot do unbounded sequential composition in one
pass — a hard ceiling from the labnotes. The operator answers this not by deepening one forward pass
but by **looping across passes**: `thesis → compile → court → read the autopsy → revise`, repeated.
Depth accumulates over revision cycles, not within a single evaluation. The evidence court
(`backtest/walk_forward.py`) is the feedback that makes each loop iteration real, and `post_trade_memory`
carries state forward — so the operator loop *is* the depth the substrate cannot provide alone.

**The ordered, non-abelian pipeline lives here.** `selection → allocation → timing → risk` is
order-dependent by design: sizing before selecting, or risk before timing, is a *different* strategy.
The VSA substrate is **measured** to penalize non-commutative composition (its `bind` is commutative,
`a*b == b*a`, with a non-abelian penalty of ~0.3–0.6). So the ordered pipeline is **lifted out** of
the kernel into `StrategyObject.target_weight`, where ordering costs nothing:

```python
def target_weight(self, prices, t):           # order matters (non-commutative) BY DESIGN
    w = self.selection(prices, t)             # which assets are in play
    w = self.allocation(prices, t, w)         # how much
    w = self.timing(prices, t, w)             # when (entry/exit gate)
    w = self.risk(prices, t, w)               # caps / vol target → final w_t
    return w
```

This is the architectural reason the operator and the regime are different modules: the operator
holds *ordered engineering*, the regime holds *commutative description* (node 02). The two questions
have different algebra, so they live in different places — and neither pays the other's tax.
