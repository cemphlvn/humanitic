# Node 03 — Execution: the weight-vector contract is the stable interface

> **TR** — Yürütme katmanı: FinRL-X tarzı ağırlık-vektörü sözleşmesi `w_t`. Yukarıdaki her şey
> değişebilir; bu arayüz değişmez. Bir strateji, `prices[:t+1]`'i kullanarak `w_t` döndüren her
> şeydir. *(Türkçe önce gelir.)*
>
> **EN** — The execution layer: the FinRL-X-style weight-vector contract `w_t`. Everything upstream
> can change; this interface cannot. A Strategy is anything that returns `w_t` using `prices[:t+1]`.
>
> **ZH** — 执行层：FinRL-X 式的权重向量契约 `w_t`。上游一切皆可变，唯此接口不可变。策略即任何
> 用 `prices[:t+1]` 返回 `w_t` 的东西。

**Status: STABLE INTERFACE** · `foundation/kernel/contracts.py` (+ `strategy_object.py`).

The execution layer is one narrow thing: a contract. Selection, allocation, timing, and risk all
**terminate in one object** — the target weight `w_t`. Everything upstream (the thesis, the regime
encoding, the operator's pipeline order, even whether a real model is in the loop) is free to change;
this face cannot. That is what makes the contract the project's *stable interface* and the backtest
*deployment-consistent*: research re-runs against the same `w_t` interface that capital would use.

The contract has exactly two rules, and they are the whole guarantee:

```python
class Strategy:                                  # the protocol
    def target_weight(self, prices, t):          # uses ONLY prices[:t+1] — causal by definition
        raise NotImplementedError

def validate_weights(w, max_gross=1.0):          # reject non-finite or over-leveraged weights
    ...                                          # gross = Σ|w| must not exceed max_gross
```

**Causality is in the type, not the etiquette.** "A Strategy is anything that, given market state up
to `t`, returns `w_t` (uses `prices[:t+1]`)." Because the signature only admits the past, the leakage
guard can *prove* compliance empirically — corrupt `prices[t+1:]` and re-ask; if `w_t` moves, the
strategy peeked and the court refuses to score it (`backtest/leakage_guard.py`,
`walk_forward.py`). The contract makes "no look-ahead" a checkable property rather than a promise.

**Why a single weight vector is the right interface.** It absorbs the lineage walls cleanly: the
operator's ordered, non-abelian pipeline (node 01) collapses into one validated `w_t` per step, so
the substrate's commutative regime description (node 02) never has to carry order. Turnover and gross
exposure are capped *at the contract* (`validate_weights`, `fees_slippage.cost` on `Σ|w_t − w_{t-1}|`),
which is where the "capacity/turnover fantasy" hazard is killed. A real-data adapter lands behind the
*same* contract, so an experiment that runs on the synthetic market re-runs unchanged on real OHLCV —
the interface is the seam that keeps the OS honest and the deployment consistent.
