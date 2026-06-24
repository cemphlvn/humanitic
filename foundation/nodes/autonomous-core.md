# Node — The Safe Autonomous Core

> **TR** — Tam otonom ama GÜVENLİ: varsayılan kâğıt (paper) ticareti; canlı sermaye, açık insan onayı
> belirteci olmadan HİÇBİR kod yolundan geçemez. Stratejiler `.local` kasasından gelir (çalışma-zamanı).
> **EN** — Fully autonomous but SAFE: paper by default; live capital passes through NO code path
> without an explicit human-approval token. Strategies come from the `.local` vault (at runtime).
> **ZH** — 全自动但安全：默认纸面交易；没有明确的人类批准令牌，真实资金不经过任何代码路径。
> 策略来自 `.local` 私库（运行时）。

**Status:** ADOPTED (paper) · live = human-gated. Code: `foundation/operator/autonomous.py`,
`foundation/execution/paper.py`, `foundation/operator/{vault,inference,critic}.py`.

## The loop (one shared, causal, event-driven path)
```
vault.list_strategies()  ─▶  decode trigram ─▶  critic.audit  ─(CLEAN?)─▶  paper_session
   (.local at runtime;          (genome)         admission gate              event-driven tick:
    fixtures in test)                                                          gross cap → turnover
                                                                              throttle → PaperBroker
                                                                              fill (slippage + partial)
                                                                              → drawdown/daily kill
```
`w_t` is the only order primitive. The tick body is identical across backtest/paper/live — only the
data source and fill engine swap (deployment consistency).

## The risk-gate stack (every tick)
1. **Hard gross cap** `|w| ≤ MAX_GROSS` (0.25) — fires before any fill.
2. **Turnover throttle** — scale the change to the budget.
3. **Drawdown circuit-breaker (KILL)** — `dd ≤ −10%` → flatten (`w=0`) and halt. Primary fail-safe.
4. **Single-bar loss limit** — a `≤ −5%` bar → flatten and halt.
Plus (runtime) a dead-man's heartbeat and a manual KILL that flattens synchronously.

## The live gate (staged escalation, human-in-the-loop)
- **synthetic → paper:** must clear the critic (`verdict == CLEAN`).
- **paper → live:** 30-day paper evidence + an **explicit human-approval token** (`LIVE_APPROVAL_TOKEN`).
  No code path unlocks live capital without that string. `run_autonomous(live=True)` raises otherwise.
- **live:** tiny notional, escalate slowly; the kill-switch / heartbeat / loss limits carry forward.

## Local inference & Article 0
The operator agent runs on a **local** engine (`inference.get_engine`): an `OfflineStub` by default
(deterministic, CI-safe), swapping to a local OpenAI-compatible server (MLX-LM / Ollama) at runtime —
**the LLM proposes, numpy/MLX executes** (LLM off the hot path). The `.local` strategy vault is read by
the runtime to trade its own IP locally; this code never creates/reads `.local`, and nothing from it
is ever routed to `publish_guard`.
