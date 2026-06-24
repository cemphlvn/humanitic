# Node — Paper Trading & Time-Interval-Infra-Fit

> **TR** — "Sahte para" finansta KÂĞIT TİCARETİ (paper trading / demo hesap / ileri-test): gerçek
> sermaye yok, CANLI kapısı kapalı. Kalıcı hesap `.local`'te ilerler. Çoklu zaman-aralığı taraması en
> iyi aralığı bulur — ama Deflated Sharpe ile (deneme = aralık sayısı) yargılanır.
> **EN** — "Dummy money" is PAPER TRADING (paper money / demo account / forward test): no real capital,
> the LIVE gate stays shut. A persistent account advances in `.local`. A multi-interval sweep finds the
> best timeframe — judged by the Deflated Sharpe (trials = #intervals) so we don't pick a lucky one.
> **ZH** — “假钱”在金融中叫纸上交易（paper trading / 模拟账户 / 前向测试）：无真实资本，实盘门关闭。
> 持久账户在 `.local` 中推进。多区间扫描找最佳周期——用 Deflated Sharpe 判定（试验数=区间数）以防选中侥幸者。

**Status:** ADOPTED. Code: `foundation/execution/paper_account.py` · `foundation/eval/interval_fit.py` ·
`foundation/runtime/paper.py`. Run: `./run.sh paper` · `./run.sh fit`.

## What it's called
Trading with simulated money is **paper trading** (also: paper money, a demo/sim account, **forward
testing**, shadow trading). Running it forward "from now on" — out-of-sample, as new data arrives, no real
capital — is exactly forward testing. Here the **LIVE gate stays shut**; nothing touches real money.

## Run it from now on
```bash
./run.sh paper     # advance the persistent paper account (.local/paper/account.json) one period
./run.sh paper     # again -> a NEW period; equity, total_return, Sharpe, max_drawdown accumulate
```
`PaperAccount` compounds equity bar-by-bar, marks to market, and tracks drawdown; state persists in
`.local/paper/` (private, 0600, gitignored). Each call is a fresh period, so the equity curve extends —
a continuous forward test, not a one-off backtest.

**The account trades the FIT-CHOSEN interval.** On the first run (or `./run.sh paper --refit`) the account
runs the time-interval sweep, picks the best timeframe by Deflated Sharpe, and **persists it** (`interval`
in the ledger). Every subsequent period resamples the strategy to that interval and steps the account at
it — so the timeframe the fit selected is the timeframe that actually trades forward.

## Time-interval-infra-fit
```bash
./run.sh fit       # sweep bar intervals (1,2,4,8,16,32); per-interval Sharpe/return/drawdown + verdict
```
For each interval the sweep runs the paper strategy and asks two questions:
1. **Performance** — Sharpe, total return, max drawdown.
2. **Infra feasibility** — below the data cadence ⇒ can't trade it; too few bars ⇒ no power. Infeasible
   intervals are flagged, not scored.
The **best fit** is chosen by the **Deflated Sharpe Ratio with n_trials = the number of feasible
intervals** — trying many timeframes is multiple testing, so the haircut keeps us from crowning a lucky
interval. The result names the timeframe where performance and infra genuinely meet.

## Honest framing
The strategy here trades a **synthetic (planted) replay** — so paper trading validates the **ledger and
the fit machinery**, not a live edge. Swap in a live feed (`./run.sh mine --live`, NTRIP creds) and the
*same* paper account + interval sweep run forward on real data, with the court + Deflated Sharpe keeping
the verdict honest.
