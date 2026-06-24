# HEALTH — computational health, checked constantly

> **TR** — Hesaplamasal sağlık, sürekli kontrol edilir. Bu Mac'in duvarlarını dürüstçe ölçeriz;
> bir duvarı asla aşmış gibi davranmayız — onu raporlarız. Çürütme etiği: kendi iddialarını kır.
> **EN** — Computational health, checked constantly. We measure this Mac's walls honestly and never
> pretend past one — we report it. Refutation ethos: try to break your own claims.
> **ZH** — 持续检查计算健康。我们诚实地测量这台 Mac 的边界，绝不假装越过某道墙——而是如实报告它。
> 反驳精神：努力推翻自己的主张。

The monitor limit-tests THIS machine: it times the VSA primitives, walks the empirical `bundle`
capacity wall (LABNOTES: *store factors not items*), times the evidence court, and watches memory.
Each check returns **PASS / WARN / FAIL** against explicit, stable thresholds. A WARN means a wall
is getting close; a FAIL means a wall was hit. Offline, numpy + stdlib only, deterministic (seeded —
never the wall clock).

```bash
PYTHONPATH=. python3 -m foundation.health.monitor
```

Exit code is `0` iff every check is PASS or WARN.

## What is checked + thresholds

| # | check | what it measures | thresholds |
|---|---|---|---|
| 1 | **VSA throughput** | `bind`, `bundle`(n=50), `cleanup`(codebook 1000) at D=4096 — ms/op and ops/s | bind WARN≥0.5 / FAIL≥5.0 ms · bundle WARN≥1.0 / FAIL≥10.0 ms · cleanup WARN≥3.0 / FAIL≥25.0 ms |
| 2 | **Capacity envelope** | the *bundle wall*: recall of planted bound pairs vs distractors over k∈{2,4,8,16,32,64,128}; first k where recall < 0.9 | recall floor 0.9 · wall WARN if k≤16 (FACTOR_CAP) · FAIL if k≤4 |
| 3 | **Backtest speed** | one `walk_forward` over a 1500-day synthetic market — ms and decisions/s | WARN≥1500 / FAIL≥8000 ms |
| 4 | **Memory** | `tracemalloc` peak MB across the whole run | WARN≥256 / FAIL≥1024 MB |
| 5 | **Suite hook** | counts `tests/test_*.py` (does *not* run them — keeps the monitor fast) | WARN if zero found |

The capacity-envelope wall (check 2) is the real computational limit test: it is the LABNOTES
`bundle` envelope, re-measured on this exact Mac. The index layer's `FACTOR_CAP=16` is the design
guard derived from this wall — store factors, not items.

<!--SNAPSHOT-->
| check | metric | value | status |
|---|---|---|---|
| VSA throughput | bind | 0.0014 ms/op (705322 ops/s) | PASS |
| VSA throughput | bundle (n=50) | 0.0962 ms/op (10392 ops/s) | PASS |
| VSA throughput | cleanup (codebook 1000) | 0.5325 ms/op (1878 ops/s) | PASS |
| Capacity envelope | recall curve | k=2:1.00 &nbsp; k=4:1.00 &nbsp; k=8:1.00 &nbsp; k=16:1.00 &nbsp; k=32:1.00 &nbsp; k=64:1.00 &nbsp; k=128:1.00 | PASS |
| Capacity envelope | **bundle wall** | **none in probed range** | PASS |
| Backtest speed | walk_forward (1500d) | 28.1 ms (52407 decisions/s) | PASS |
| Backtest speed | OOS edge | 0.60 bits / cap 1581 (exceeded=False) | PASS |
| Memory | tracemalloc peak | 65.4 MB | PASS |
| Suite | test_*.py files | 11 (via tests/run_all.py) | PASS |

**OVERALL: PASS** &nbsp;·&nbsp; D=4096 &nbsp;·&nbsp; numpy-only, this Mac, deterministic (seeded).
<!--/SNAPSHOT-->

## Improve — concrete TODOs to push the walls

- **bind/bundle kernel.** `bind` is embarrassingly parallel (thread i touches a[i],b[i] only) and
  `bundle` is a bandwidth-bound reduction. A Metal / Triton fused kernel would move ops/s by an
  order of magnitude — measure the gap here first, then port.
- **Faster cleanup.** `cleanup` is "dequant matmul + top-k" against the codebook. A blocked /
  batched matvec (or a packed-phase int8 codebook) cuts the cleanup ms; benchmark vs the current
  one-`@`-matvec baseline before claiming a win.
- **Larger-D capacity.** Re-run the envelope at D∈{8192, 16384} — capacity is linear (`C(D)=0.386·D`),
  so the wall-k should rise. Record the new wall and confirm the linear law on this Mac.
- **The wall lives past the probe (measured).** For *exact-codeword* top-k recall at D=4096 against a
  256-pair distractor field, recall holds ≥0.9 even out at k=2048 (measured: k=256→0.996, 512→0.972,
  1024→0.954, 2048→0.946) — so the default probe (k≤128) honestly reports "none in range." The
  LABNOTES `FACTOR_CAP=16` is the conservative guard for *noisy / unbound-then-recover* retrieval, a
  harder regime than exact-codeword cleanup. TODO: add a second envelope curve that injects phase
  noise into the query so the monitor surfaces the *operational* wall (the one FACTOR_CAP encodes),
  not just the exact-codeword ceiling.
- **Recall-curve archival.** Append each run's recall curve to a ledger so wall drift over time
  (numpy upgrades, OS, thermal) is visible — health *checked constantly* means health *tracked*.
- **Decisions/sec.** The walk_forward loop is a Python `for` over T; a vectorized causal pass would
  lift decisions/s. Keep the causal/leakage guarantees — speed never buys a peek.
