# 11 — Safety: guardrails before capital

> **TR** — Güvenlik burada bir slogan değil, kapılarla zorlanan bir disiplindir. Bu planın hiçbir
> yerinde **canlı sermaye yoktur**. Mahkeme, sızdıran stratejileri reddeder; brüt maruziyet
> sınırlıdır; tırmanma kademelidir (sentetik → kâğıt → yalnızca açık insan onayıyla küçük canlı);
> ve yayım koruması her dışa açılan yolu sarar.
> *(Türkçe önce: İngilizce ile Çince arasındaki köprü.)*
>
> **EN** — Safety here is a discipline enforced by gates, not a slogan. **No live capital anywhere
> in this plan.** The court refuses leaky strategies; gross exposure is capped; escalation is staged
> (synthetic → paper → small live, *only* by explicit human approval); the publish guard wraps every
> outbound path.
>
> **ZH** — 安全在这里是由关卡强制执行的纪律，而非口号。**本计划中任何环节都没有实盘资金。**
> 法庭拒绝泄漏的策略；总敞口被设上限；升级是分阶段的（合成 → 模拟 → 仅经明确人工批准的小额
> 实盘）；发布守卫包裹每一条对外路径。

**Status: a foundation node · ESG-Governance jurisdiction · amendable EDR · Article 0 binds it.**

The first guardrail is the simplest and the most absolute: **no live capital is in the plan.**
[`PLAN.md`](../../PLAN.md) runs synthetic-first, offline, on this Mac — every arc ships something that
*runs and refutes* without a brokerage anywhere near it. Safety is cheapest when the default state is
*cannot lose money*, and that is the default state by construction, not by promise.

The second guardrail is **the court refuses leaky strategies.** A strategy that peeks at the future
is not merely inaccurate — it is *dangerous*, because it looks brilliant in backtest and then moves
real capital on an edge that does not exist. `foundation/backtest/leakage_guard.py` corrupts the
future and re-asks for `w_t`; if the answer changes, the strategy peeked and is rejected
(`assert_no_leak` raises). Honesty is enforced empirically: we try to break our own strategies, the
way the LABNOTES try to refute their own claims. No leaky strategy reaches the next gate.

The third guardrail is **bounded exposure.** `validate_weights` in
[`foundation/kernel/contracts.py`](../kernel/contracts.py) rejects non-finite weights and any vector
whose gross exposure exceeds `max_gross` — leverage cannot sneak in through a malformed weight vector.
Turnover and capacity caps live in the same contract, so a backtest cannot fantasize a position size
the market could never fill. The weight-vector contract is the choke point: everything upstream may
change, but nothing reaches execution except a validated, capped `w_t`.

The fourth guardrail is **staged escalation with a human in the loop.** The ladder is
**synthetic → paper → small live**, and the last rung is reachable *only by explicit human approval* —
never by the agent's own operator loop. The agent can revise strategies all day in synthetic and
paper; it cannot promote itself to live capital. Wrapping all of it is the **publish guard**
([`foundation/privacy/publish_guard.py`](../privacy/publish_guard.py)): every outbound path — export,
forum post, log, telemetry — routes through `publish()`, which refuses anything with `.local`
provenance (Article 0.2) and cannot itself be hidden (Article 0.3). Capital safety and information
safety share one principle: the dangerous action requires a gate the system cannot open alone.

See: [`00-eternity-clause`](../constitution/00-eternity-clause.md) · [`10-alignment`](10-alignment.md)
· [`20-backtesting-ethics`](20-backtesting-ethics.md)
