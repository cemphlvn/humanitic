# Node — Persona-Driven Synthetic Data (the human-behavior latent engine)

> **TR** — Sentetik kişilikler (Nemotron-benzeri) piyasayı sürer: kişilikler → duyarlılık (sürü
> geri-beslemesi) → rejim → fiyatlar. Piyasa, sentetik insan davranışının BİR FONKSİYONUDUR.
> **EN** — Synthetic personas (Nemotron-alike) drive the market: personas → sentiment (herd
> feedback) → regime → prices. The market is a FUNCTION of synthetic human behavior.
> **ZH** — 合成人物（类 Nemotron）驱动市场：人物 → 情绪（羊群反馈）→ 机制 → 价格。
> 市场是合成人类行为的一个函数。

**Status:** ADOPTED. Code: `foundation/data/{synthetic_personas,adapter}.py`. Reference: index `nemotron-personas`.

## The engine
```
generate_personas(n)         occupation archetype (retail/institutional/insider) + risk appetite + herd
        │  aggregate
sentiment_t = 0.9·s + herd·s + noise          a herd-feedback AR process in [-1, 1]
        │
regime_t  = risk_on (s>0.2) | risk_off (s<-0.2) | chop
        │
prices    = regime drift/vol, modulated by aggregate appetite + sentiment
```
This is the **human-behavior latent engine**: the market is generated *by* synthetic humans, so a
backtest here is a backtest on **nemotron-alike** data. It maps the Nemotron persona schema (occupation,
sophistication) onto behavioral market-participant archetypes — the `nemotron-personas` index entry's
intended ark use.

## Behind the contract
`adapter.PersonaSource` / `SyntheticSource` expose `prices()` behind the weight-vector contract;
causality is enforced downstream (strategies read only `prices[:t+1]`). Real sources — Stooq, Polygon,
CDP onchain — are runtime adapters behind the *same* interface (registered, HUMANITIK-licensed
partners speaking the common language). `experiments/f04_persona_backtest` runs the full stack on this
data: autonomous paper sessions + backtest-across partners, with live capital hard-gated.
