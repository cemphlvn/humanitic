# Node 00 — Thesis: engineer strategies, don't predict prices

> **TR** — Modelden fiyat tahmin etmesini istemiyoruz; bir dağıtım-tutarlı finans mimarisi içinde
> strateji **üretmesini, sınamasını, onarmasını ve denetlemesini** istiyoruz. *(Türkçe önce gelir —
> İngilizce ile Çince arasındaki köprü.)*
>
> **EN** — We do not ask the model to predict prices; we ask it to **engineer, test, repair, and
> audit** strategies inside a deployment-consistent finance architecture.
>
> **ZH** — 我们不要求模型预测价格；我们要求它在一个部署一致的金融架构中**工程化、测试、修复、
> 审计**策略。

**Status: FOUNDING CLAIM** · grounded in `README.md` and the green floor (`foundation.selftest`).

ARK is a **Macro Strategy OS**, not a trading bot. The category error it refuses is "ask a big model
for tomorrow's price." Prices are the thing the architecture *tests against*, never the thing it
predicts. The unit of work is the **StrategyObject** — `{thesis, data_sources, regime_assumptions,
selection, allocation, timing, risk, validation_results, execution_adapter, post_trade_memory}` — a
tested, revisable *object*, not a trade. The operator's job is to engineer that object well, and the
court's job is to try to refute it honestly. Honesty is the success metric, not return.

The mechanism is the **operator loop**: `state → action → feedback → revision`. A thesis comes in
("AI-capex boom benefits power/grid/cooling"); the operator compiles it to a StrategyObject; the
evidence court runs it walk-forward with costs and a leakage guard; the verdict is an OOS tear-sheet
if it lives or an **autopsy** if it dies. Either way the lesson is filed and attributed in the commons
(HUMANITIK), and the operator revises. A refuted strategy is a **result**, not a defeat — the failure
database is where most of the value accrues.

This claim rests on the five layers, each honoring a **measured** lineage wall: the **operator**
(node 01) supplies depth past the TC⁰ ceiling and carries the ordered non-abelian pipeline; the
**regime** layer (node 02) holds the commutative "what regime" description on the FHRR torus kernel
within its capacity envelope; the **execution** layer (node 03) terminates everything in one stable
weight-vector contract `w_t`. Because the contract is the only interface to capital, the entire
research surface can change without ever touching how a strategy is deployed — which is what makes the
backtest *deployment-consistent* and the whole thing infrastructure rather than a prediction.
