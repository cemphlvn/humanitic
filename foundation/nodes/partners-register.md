# Node — The HUMANITIK-Licensed Partner Register

> **TR** — Desteklenen ortaklar (broker, veri, çıkarım motoru) HUMANITIK lisansı altında kayıtlıdır:
> açık çekirdek, atıf zorunlu, %5 vakıf maliyeti, gizliliğe saygılı. Aynı strateji, ortakların
> uygulama modelleri ARASINDA test edilir — ortaklar-arası dağıtım açığı.
> **EN** — Supported partners (brokers, data, inference engines) are registered under the HUMANITIK
> license: open-core, attribution required, 5% foundation cost, privacy-respecting. The same strategy
> is back-tested ACROSS partners' execution models — the cross-partner deployment gap.
> **ZH** — 受支持的合作伙伴（券商、数据、推理引擎）在 HUMANITIK 许可下注册：开放内核、需署名、
> 5% 基金会成本、尊重隐私。同一策略在各合作伙伴的执行模型间回测——跨伙伴的部署差距。

**Status:** ADOPTED. Code: `foundation/commons/registry.py`, `foundation/execution/{broker,cross_broker}.py`.

## The register (HUMANITIK-licensed)
A partner cannot be registered without a **HUMANITIK license** block — `require_humanitik_license`
refuses anything else. Each license carries the scheme, the attribution, the **5% foundation cost**
(single-sourced from `trigram.FOUNDATION_COST`), and the privacy terms (`.local` never leaves).
Seeded partners:

```
broker     paper (supported) · alpaca (planned) · ibkr (planned)
data       stooq (planned, point-in-time)
inference  mlx-lm (supported) · ollama (planned)
```

## Backtest across partners
`cross_broker.backtest_across(prices, strategy)` runs one strategy through every partner's modeled
execution (`BrokerProfile`: slippage + partial-fill characteristics) and returns the **equity spread**
(execution risk) and a **robust** flag (survived every partner's fills). A strategy that only lives on
`paper-ideal` and dies on `retail-adverse` is fragile; one robust across all is execution-consistent.
Real broker adapters (`AlpacaAdapter`, `IBKRAdapter`) are **runtime-only** — they need credentials and
the human-approved live gate, and raise offline.
