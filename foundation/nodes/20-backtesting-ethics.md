# 20 — Backtesting ethics: the methodology as an EDR

> **TR** — Etik geri-test, dürüstlüğün mühendisliğidir. Her tehlike (geleceğe bakma/sızıntı, işlem
> maliyetleri/kayma, örnek-içi aşırı uyum, hayatta kalma yanlılığı, çoklu test, rejim kırılganlığı,
> kapasite/devir hızı fantezisi) **koddaki bir savunmaya** eşlenir. Bu bir **EDR'dir**: forumda
> müzakere edilir ve değiştirilebilir — Madde 0'ın aksine. En güçlü itiraz kazanır.
> *(Türkçe önce: İngilizce ile Çince arasındaki köprü.)*
>
> **EN** — Ethical backtesting is the engineering of honesty. Each hazard (look-ahead/leakage,
> transaction costs/slippage, in-sample overfit, survivorship bias, multiple testing, regime
> brittleness, capacity/turnover fantasy) is mapped to **a defense in code**. This is an **EDR**:
> deliberated in the forum and amendable — *unlike* Article 0. The strongest objection wins.
>
> **ZH** — 伦理回测是诚实的工程化。每一种风险（前视/泄漏、交易成本/滑点、样本内过拟合、
> 幸存者偏差、多重检验、机制脆弱性、容量/换手幻想）都映射到**代码中的一道防御**。这是一份
> **EDR**：在论坛中被审议、可被修订——*与第 0 条不同*。最有力的反驳获胜。

**Status: an Ethics Decision Record (ESG-Governance) · DELIBERATED · AMENDABLE · in the forum's
jurisdiction.** This is the explicit contrast with [`Article 0`](../constitution/00-eternity-clause.md),
which is RATIFIED, non-amendable, and *not* an EDR. A backtest methodology that could never be
improved would be its own worst hazard; so this node is deliberately revisable — bring the strongest
objection and it can change.

A backtest is a **claim about the future stated in the language of the past**, and every honest
claim invites refutation. The hazards below are the standard ways a backtest *lies* — and the failure
database (the moat, [`HUMANITIK`](HUMANITIK.md)) exists precisely so that each lie, once caught, stays
caught. Honesty is the success metric, not return.

## Hazard → defense

| Hazard (how a backtest lies) | Defense (in this repo) |
|---|---|
| **Look-ahead / leakage** — strategy peeks at the future | `backtest/leakage_guard.py` corrupts `prices[t+1:]` and re-asks for `w_t`; if it changes, **reject** (`assert_no_leak`). Catch = 100% (invariant **H**) |
| **Transaction costs / slippage** — frictionless fantasy | `backtest/fees_slippage.py` charges cost on turnover; a zero-cost backtest shifts by exactly the modeled bps |
| **In-sample overfit** — tuned on the test set | walk-forward with **OOS reported separately** (`backtest/walk_forward.py`); only OOS counts toward a verdict |
| **Survivorship bias** — only winners in the universe | point-in-time universe; survivorship flagged + handled for real data (Arc 1) |
| **Multiple testing** — quietly discard the losers | **every** variant tested is logged to the **failure database** — no silent discards, each with an attributed autopsy |
| **Regime brittleness** — one regime's luck | evaluate across all synthetic regimes; **report per-regime**, name the regime that broke it |
| **Capacity / turnover fantasy** — unfillable size | turnover & gross-exposure caps in the contract (`validate_weights`, `kernel/contracts.py`) |

## Why this is the ethics of it, not just the engineering

The list above is usually taught as *technique*. We file it as *ethics* because every entry is a way
to deceive someone — a future operator, a family member whose capital is on the line, yourself. A
look-ahead leak is not a bug; it is a false promise that looks like skill. An uncharged cost is not an
optimization; it is an edge that does not exist. Survivorship bias is not an oversight; it is a survey
that interviewed only the survivors. Naming each hazard as a hazard, and binding it to a defense that
*runs*, is how this repo refuses to lie to the humans who trust it.

The discipline is **refutation-first**: we try to break our own strategies, exactly as the LABNOTES
try to refute their own claims. The leakage guard is an attack on our own code; the multiple-testing
defense forbids us from hiding our own failures; per-regime reporting forbids us from cherry-picking
our own luck. When a strategy dies under this gate, the autopsy is filed to the failure database and
**attributed** — a refuted idea is a result, not a defeat, and the person who refuted it is credited.

Because this is an EDR, it is **alive**: a stronger objection (a hazard we missed, a defense that is
weaker than claimed, a cost model that overcharges) is deliberated in the forum, and on ratification
this node and its tests are updated. The methodology improves the same way a strategy does — through
the operator loop, applied here to *how we judge*. That revisability is the difference between this
node and Article 0, and it is on purpose.

See: [`00-eternity-clause`](../constitution/00-eternity-clause.md) · [`11-safety`](11-safety.md) ·
[`HUMANITIK`](HUMANITIK.md) · [`../backtest/leakage_guard.py`](../backtest/leakage_guard.py) ·
[`../backtest/walk_forward.py`](../backtest/walk_forward.py) ·
[`../backtest/fees_slippage.py`](../backtest/fees_slippage.py) ·
[`../kernel/contracts.py`](../kernel/contracts.py)
