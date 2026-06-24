# Node — Win Rate (the honest way)

> **TR** — Kazanma oranı TEK BAŞINA yalan söyler: ödeme oranı (kazanç/kayıp) olmadan anlamsız. Bu yüzden
> hit rate + payoff + beklenti + BAŞABAŞ kazanma oranı + kâr faktörü, ARTI istatistiksel anlamlılık
> (başabaşa karşı binom testi + Wilson aralığı) birlikte raporlanır. Sürekli-pozisyon için birim = bar.
> **EN** — Win rate ALONE lies: it's meaningless without the payoff ratio. So we report hit rate + payoff
> + expectancy + BREAKEVEN win rate + profit factor, PLUS the statistical significance (binomial test vs
> breakeven + a Wilson interval). For a continuous-position strategy the unit is the bar.
> **ZH** — 单看胜率会骗人：没有盈亏比就无意义。所以同时报告命中率+盈亏比+期望+保本胜率+盈利因子，外加
> 统计显著性（对保本的二项检验+Wilson 区间）。连续持仓的单位是 bar。

**Status:** ADOPTED. Code: `foundation/eval/winrate.py`. Surfaced in `./run.sh paper` (`win` block) and the
capital-growth court (`significance.court(...)["win"]`).

## What we measure (and why each)
| metric | meaning |
|---|---|
| **hit rate** | % positive bars (the continuous-position "win rate"; not per-trade) |
| **payoff ratio** | avg win / avg loss — the half a bare win rate hides |
| **expectancy** | hit·avgWin − (1−hit)·avgLoss — expected P&L per bar (the real number) |
| **breakeven win rate** | `1/(1+payoff)` — the hit rate you'd need just to break even |
| **profit factor** | gross profit / gross loss |
| **Wilson CI** | confidence interval on the hit rate (honest for small n) |
| **p vs breakeven** | binomial test: is the hit rate *significantly* above its breakeven? |

## The identity that keeps us honest
```
hit_rate > breakeven_win_rate   ⟺   expectancy > 0
```
So a **high hit rate is not an edge** if the payoff is poor — and the test proves it. `test_winrate`:
- **80% hit rate, small wins / rare big losses** → expectancy < 0, hit (0.80) **below** breakeven (~0.857) → `beats_breakeven=False`. A great-looking win rate that loses money.
- **35% hit rate, winners 3× losers** (trend-following) → expectancy > 0, hit (0.35) **above** breakeven (0.25), binomial p < 0.05 → `beats_breakeven=True`. A low win rate that's a real edge.

This is the win-rate analog of the court's discipline: never quote the headline number without the test
that can refute it.
