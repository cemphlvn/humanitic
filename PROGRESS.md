# PROGRESS — ark ledger

Durable record of the build, newest first. Local-only; not public until notice. (House style: the
lineage's running ledger, for markets.)

## 2026-06-24 — edge-in-bits wired into the court

- **The court now reports edge in BITS.** `walk_forward` returns `edge`: OOS held bits via the
  conservation spine (`directional_edge` = `n·(1 − H₂(e))`), the drift-null subtracted as honest
  excess, the IS→OOS bit-retention as an overfit signal, and **`capacity_exceeded` — the court
  refuses to claim edge past `C(D)=0.386·D`.** `experiments/f01_ethical_backtest/run.py` runs the
  whole pipeline end to end. Added `Makefile` (`make floor|test|f01`). 8/8 suites green.

## 2026-06-24 — foundation-math spine

- `foundation/spine/` — the peras conservation law ported to finance: held-information law,
  source↔sink coupling (`ρ*·I_g ≈ λ`), capacity `C(D)`, Shannon converse, KAM wall `K_g=0.9716`;
  the cognition⟷finance⟷physics map; `mining_unlocks_trading` (the law, not a fee); the FHDD sink.

## 2026-06-24 — index + trigram economy

- Local knowledge index (`store.py`): encode→store→retrieve(nearest-regime), `FACTOR_CAP`, Article 0
  gate. 12 entries seeded by a parallel research workflow; 12/12 self-recall.
- Conceptual-trigram economy (`trigram.py`): strategy→trigram, the probe, novelty, 95/5
  cartographer/foundation split; privacy-bounded.

## 2026-06-24 — identity + Arc 0 floor + eternity clause

- Identity: `CLAUDE.md` (+ AGENTS/GEMINI/copilot). Offline, local-only, Turkish-first, refutation ethos.
- Floor: VSA primitives, weight-vector contract, StrategyObject, synthetic market + walk-forward +
  costs + leakage guard. **Article 0** (the eternity clause) enforced in code.

Commits: `ff6e137` → `d160138` → `3deda28` → `2a57c61` → `02f644c` → (this).
