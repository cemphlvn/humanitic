# PLAN — Live Helium → HNT: Pre-Registration (the lead live test)

> **TR** — ÖN-KAYIT: veriye dokunmadan ÖNCE yazıldı; toplama başlayınca DEĞİŞMEZ. Helium ilk gerçek test,
> çünkü HNT'nin UZUN likit geçmişi var — verdict bu çeyrekte mümkün (GEOD haftalık). İlk anlamlı sonuç
> kâr değil, dürüst bir HÜKÜM.
> **EN** — PRE-REGISTRATION: written BEFORE data; frozen once collection starts. Helium is the FIRST real
> test because HNT has a LONG liquid history — a verdict is reachable THIS QUARTER (GEOD is weeks old).
> The first meaningful result is not a P&L; it is an honest VERDICT, informative either way.

**Status:** PRE-REGISTRATION (commit before reading any verdict). Target: Helium network throughput → HNT.
Run the measurement: `./run.sh measure --target helium`. Apparatus (all built): `data/adapters/helium` ·
`ingest/` · deseasonalize · `eval/{verdict,causality,significance,winrate,power}`.

## Why Helium leads (not GEODNET)
Identical LoRaWAN data-plane + causal shape, but **HNT has years of liquid hourly history** while GEOD has
weeks. The power analysis needs ~2,500 hourly bars; HNT *has them now*, so the verdict doesn't wait on a
3-month forward-collect. **Helium = the first verdict; GEODNET = the sector-correlated cross-check.**

## H1 — the hypothesis (and the null)
**H1:** the *deseasonalized* Helium network **data-transfer anomaly** (Data Credits burned / packets per
hour) at *t* has positive predictive information for the HNT return over the next bar, because data
transfer burns DC → HNT demand via **burn-and-mint equilibrium**. **H0:** no predictive relationship
beyond chance / beyond LoRaWAN-sector beta. Meaningful under **either** outcome.

## Frozen definitions
- **Signal** `s_t`: DC-burned-per-hour (network data transfer), **deseasonalized** (causal trailing-mean
  removed — the usage rhythm is a confound), standardized to a z-score.
- **Target** `r_{t+1}`: forward HNT **hourly** log-return (holding horizon k = 1).
- **Join:** causal as-of (`asof_searchsorted`, int64 UTC), `assert_causal` — no lookahead.

## Decision rule (the verdict bundle) — frozen thresholds
MEANINGFUL requires ALL, on out-of-sample / walk-forward data (computed by `eval/verdict.measure`):
- **Granger** causal (p < 0.05) — the lead is directional, not contemporaneous.
- **Capital-growth court** MEANINGFUL (Newey-West |t|>1.96, block-bootstrap p<0.05, permutation p<0.05).
- **Deflated Sharpe** ≥ 0.95 with **n_trials = N_TRIALS** and empirical `sr_variance`.
- **Win rate** beats breakeven.
- **Noise control** (shuffled returns) → **NOT MEANINGFUL** (the apparatus can say no).

## n_trials budget — **N_TRIALS = 1**
One signal, one timeframe (hourly), one horizon (k=1). Every variant ever tried increments N_TRIALS. From
`eval/power`: at n_trials=1 an IC of 0.05 needs ~2,475 bars (HNT has them); let trials creep to 3 and a
0.05 edge becomes **INFEASIBLE in any timeframe** (the multiple-testing floor exceeds it). Discipline is
the experiment.

## Power — feasible NOW
`detectable_ic(2500 obs, n_trials=1) ≈ 0.05`. HNT's history yields ≥ 2,500 hourly bars immediately → ~80%
power at IC ≥ 0.05, comfortable at IC ≥ 0.10. **No collection wait** — the verdict is available this
quarter. (Read it once, at N; no peeking / early stopping.)

## Procedure (staged, go/no-go)
1. **Pre-register** — this file, committed, before any verdict. ✅
2. **Data-integrity sprint** — HNT hourly price source (Coinbase/CoinGecko) + Helium network-stats
   (`HELIUM_API_URL`); verify UTC clock alignment, causal as-of (no lookahead), PIT, gaps/staleness,
   lineage hash. **Deliverable: a data-quality report.** *Gate: trustworthy?*
3. **Assemble ~2,500 hourly bars** from HNT history (no peeking at the verdict).
4. **One verdict run** — `verdict.measure(signal, fwd, n_trials=1)`: deseasonalize → causal join → the
   bundle + noise control, once.
5. **Go / no-go** — MEANINGFUL → paper-forward at the fit interval, then GEODNET as the sector cross-check
   (orthogonality vs HNT); NOT MEANINGFUL → retire H1, log it, next candidate.

## First meaningful result (definition)
The **verdict bundle on ~2,500 real, PIT-correct, deseasonalized hourly bars**: `{IC ± CI, Granger p,
Deflated Sharpe, win-rate vs breakeven, court verdict, noise-control verdict}`. **NOT MEANINGFUL is a full
result** (falsifies H1, saves capital). MEANINGFUL = license to paper-forward, not a profit claim.

## Honest expectation
Plan for **NOT MEANINGFUL on the first pass** — base rate, and burn-and-mint demand is a slow, possibly
sector-wide driver. The value is a screen strict enough to make a rare real edge believable.

## Missing inputs only
Every measurement organ exists and is tested. The only missing inputs: **(a) `HELIUM_API_URL` + an HNT
hourly price source** (`./run.sh creds --target helium`), and **(b) this pre-registration's discipline.**
Then `./run.sh measure --target helium` delivers the verdict — once, at N.
