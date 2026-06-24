# PLAN — Live GEODNET → GEOD: Pre-Registration

> **TR** — Bu bir ÖN-KAYITTIR: veriye dokunmadan ÖNCE yazıldı; veri toplama başladıktan sonra
> DEĞİŞTİRİLMEZ. İlk anlamlı sonuç bir KÂR değil, dürüst bir HÜKÜMDÜR — her iki yön de bilgidir.
> **EN** — This is a PRE-REGISTRATION: written BEFORE touching data; NOT edited once collection begins.
> The first meaningful result is not a P&L — it is an honest VERDICT, informative either way.

**Status:** PRE-REGISTRATION (commit before data). Target: GEODNET station throughput → GEOD.
Apparatus (all built): `data/align` (causal as-of) · `ingest/` (PIT + lineage) · `regime` deseasonalize ·
`eval/{causality,significance,winrate,power}` · `runtime/{mine,paper}`.

## H1 — the hypothesis (and the null)
**H1:** the *deseasonalized* GEODNET station-throughput anomaly at time *t* has positive predictive
information for the GEOD return over the next *k* bars, because: throughput ∝ network usage ∝ revenue ∝
the ~80%-revenue buyback-and-burn ∝ GEOD demand. **H0:** no predictive relationship beyond chance /
beyond a shared seasonal driver. The result is meaningful under **either** outcome.

## Signal & target (frozen definitions)
- **Signal** `s_t`: RTCM epochs-per-window (station throughput), **deseasonalized** (subtract the causal
  trailing mean — the subscriber rhythm is a confound, not edge), standardized to a z-score.
- **Target** `r_{t+1..t+k}`: forward GEOD log-return over the holding horizon.
- **Join:** `align.asof_searchsorted` (causal, `side='right'-1`), int64 UTC timestamps, GPS-time→UTC
  reconciled. **No lookahead** asserted by `assert_causal`.

## Timeframe (pre-registered, SINGLE)
**Hourly bars, holding horizon k = 1.** Crypto trades 24/7 (≈8760 bars/yr), so hourly accumulates
observations ~24× faster than daily — the difference between a verdict in **months vs years** (see power).
The interval is **fixed here**; we do NOT sweep `interval_fit` for the first verdict (a sweep is N trials —
see budget).

## Decision rule (the verdict bundle) — frozen thresholds
MEANINGFUL requires ALL, on out-of-sample / walk-forward data:
- **Granger** `causality.granger_causality(s, r)` → `causes = True` (p < 0.05): the lead is directional.
- **Capital-growth court** `significance.court(s, r)` → `MEANINGFUL` (Newey-West |t|>1.96, bootstrap p<0.05,
  permutation p<0.05).
- **Deflated Sharpe** `significance.deflated_sharpe(..., n_trials = N_TRIALS, sr_variance = empirical)` → ≥ 0.95.
- **Win rate** `winrate.hit_rate_significance` → `beats_breakeven = True`.
- **Noise control** (shuffled returns) → **NOT MEANINGFUL** (the apparatus can say no).

## n_trials budget — **N_TRIALS = 1** (this is the whole game)
We pre-commit to **exactly one** signal/timeframe/horizon. Why it is non-negotiable (from `eval/power`):

| target IC | n_trials = 1 | n_trials = 3 |
|---|---|---|
| **0.05** | feasible — **2,475 obs** (~3.4 months hourly) | **INFEASIBLE** (sr0 0.085 > 0.05) |
| **0.10** | feasible — **620 obs** (~26 days hourly) | 28,537 obs (~3.3 yr) — effectively dead |

Letting the trial count creep to 3 (a small sweep, a couple of "let me also try…") makes a real IC=0.05
edge **undetectable in any timeframe** — the multiple-testing floor exceeds the edge. Every variant we
ever try MUST increment `N_TRIALS`. Discipline here *is* the experiment.

## Power analysis (how much data before a verdict is even possible)
With `N_TRIALS = 1`, `detectable_ic(2000 obs) ≈ 0.056`. **Plan: collect ~2,500 hourly bars (~3.5 months)**,
which gives ~80% power to detect IC ≥ 0.05 and comfortable power for IC ≥ 0.10. Do **not** read a verdict
before the pre-registered N is reached (no peeking — early stopping is multiple testing in disguise).

## Procedure (staged, with go/no-go gates)
1. **Pre-register** — this file, committed, before data. ✅ (you are reading it.)
2. **Data-integrity sprint** — pull a small sample; verify: GPS-time↔UTC clock skew bounded, causal
   as-of (no lookahead), point-in-time correctness (`ingest/bitemporal`), gaps/staleness, lineage hash
   (`ingest/lineage`). **Deliverable: a data-quality report.** *Gate: data trustworthy?*
3. **Collect** the pre-registered ~2,500 hourly bars, forward, no peeking.
4. **One honest run** — deseasonalize → causal join → the verdict bundle + noise control, once.
5. **Go / no-go** — MEANINGFUL → promote to paper-forward at the (now allowed) fit interval; NOT
   MEANINGFUL → retire H1, log it, next candidate from the screening rubric.

## The first meaningful result (definition)
Not a return. It is the **verdict bundle on ~2,500 real, PIT-correct, deseasonalized hourly bars**:
`{IC ± CI, Granger p, Deflated Sharpe, win-rate vs breakeven, court verdict, noise-control verdict}`. A
**NOT MEANINGFUL is a full result** — it falsifies H1 and saves capital. A MEANINGFUL result is the
*license to begin paper-forward*, not a profit claim.

## Honest expectation
Plan for **NOT MEANINGFUL on the first pass** — it is the base rate, and the buyback-burn lead is slow and
possibly competed away. The value is a screen strict enough to make the rare real edge believable.

## What's built vs. the only missing input
Every measurement organ above exists and is tested. The **only missing inputs are (a) your NTRIP creds**
(`./run.sh creds` → `security add-generic-password -s ark -a NTRIP_CASTER -w` …) **and a GEOD hourly price
source**, plus **(b) this pre-registration's discipline**. Then: `./run.sh mine --live` collects, the court
delivers the verdict — once, at N.
