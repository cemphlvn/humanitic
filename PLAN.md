# PLAN — implementation guide, with E2E tests in between

Each step ships something that **runs and refutes** on this Mac, offline, and is gated by an E2E
test. No live capital anywhere in this plan. **Not public until notice.**

Run the gates anytime:
```bash
PYTHONPATH=. python3 -m foundation.selftest
PYTHONPATH=. python3 tests/run_all.py
```

## Arc 0 — the readable floor + the eternity clause ✅ DONE

**Shipped:** the five VSA primitives (`foundation/kernel/vsa.py`), the weight-vector contract
(`contracts.py`), the `StrategyObject` primitive, the publish guard (Article 0), the synthetic
regime-switching market, walk-forward + costs + leakage guard, and the constitution.

**E2E gate (green):** `foundation.selftest` →
`bind→unbind = +1.000`, OOS Sharpe finite, `clean leak=False`, `leaky leak=True`,
`.local publishable=False`. Suites: `test_kernel`, `test_backtest`, `test_constitution`.

## Arc 1 — harden the evidence court

**Build:** purged/embargoed walk-forward folds; survivorship-aware universe handling; turnover &
capacity caps; a richer cost/slippage model; tear-sheet report.
- **E2E test:** the guard catches an injected look-ahead leak (OOS Sharpe collapses ≥ 50% vs IS on
  the leaky variant) and the cost model shifts a zero-cost backtest by exactly the modeled bps.
- **DoD / SMART:** by the arc's close, `test_backtest` asserts both, plus a purged-fold test with
  zero train/test overlap.

## Arc 2 — the regime layer (VSA + JEPA-lite)

**Build:** encode market snapshots → FHRR regime vectors (`bind` feature:level, `bundle`); a regime
codebook; `cleanup` nearest-regime recall; a numpy JEPA-lite transition predictor (regime_t →
regime_{t+1}). **Respect the capacity envelope — report the wall.**
- **E2E test:** held-out regime classification ≥ 70% on the 4-regime synthetic problem (chance 25%);
  JEPA-lite beats persistence by ≥ 10pp OOS; the report names the feature-count where `bundle`
  crosstalk breaks recall.

## Arc 3 — the operator loop

**Build:** thesis → compile `StrategyObject` → run the court → read the autopsy → revise.
**Deterministic first** (no LLM). The ordered non-abelian pipeline (selection→allocation→timing→risk)
lives here, never in the abelian VSA.
- **E2E test:** ≥ 3 revision cycles offline; ≥ 3 attributed index entries; ≥ 1 autopsy in the failure
  database; zero network; zero `.local` leakage.

## Arc 4 — commons + privacy spine (HUMANITIK)

**Build:** the local index split (public commons ⟂ `.local`); attribution ledger + contribution
counter; the privacy fuzz-test.
- **E2E test:** 0 `.local` tokens across 100 commons exports; the ledger tallies contributions in a
  3-contributor fixture.

---

## The ethical-backtest methodology (every backtest passes this gate)

| Hazard | Defense (in this repo) |
|---|---|
| Look-ahead / leakage | `leakage_guard` corrupts the future and refuses peekers — already enforced |
| Transaction costs / slippage | `fees_slippage.cost` charged on turnover — already enforced |
| In-sample overfit | walk-forward **OOS reported separately**; only OOS counts |
| Survivorship bias | point-in-time universe; flag + handle for real data (Arc 1) |
| Multiple testing | every variant tested is logged to the **failure database** — no silent discards |
| Regime brittleness | evaluate across all synthetic regimes; report per-regime |
| Capacity/turnover fantasy | turnover & gross-exposure caps in the contract |

## f01 — the culminating E2E experiment

**Goal:** one macro thesis → a `StrategyObject` → an **ethical backtest on market data**, end to end.

1. **Thesis in** (e.g., "AI-capex boom benefits power/grid/cooling").
2. **Compile** to a `StrategyObject` (selection→allocation→timing→risk).
3. **Court:** walk-forward, costs, leakage-guard, the full methodology table above.
4. **Verdict:** OOS tear-sheet; if it dies, an **autopsy** to the failure database (the moat).
5. **Attribution:** the lesson is credited in the local index (HUMANITIK).

**Data:** synthetic regime-switching market today (offline, ground-truth labels). A point-in-time
real-data adapter (free daily OHLCV) lands in Arc 1 behind the *same* contract, so f01 re-runs on
real market data unchanged. See [`experiments/f01_ethical_backtest/`](experiments/f01_ethical_backtest).

**Success:** f01 runs offline start-to-finish, the leakage-guard passes, costs are charged, OOS is
honest, and a dead strategy produces a filed autopsy. Honesty is the success metric, not return.
