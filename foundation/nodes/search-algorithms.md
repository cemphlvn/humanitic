# Node — Search Algorithms (three problems, three answers)

> **TR** — Üç arama problemi, üç yanıt: as-of birleştirme için ikili arama; temizleme için TAM matmul
> (ANN değil — demet kapasite duvarı); çarpanlara ayırma için REZONATÖR ağı. Kısıtlar daha basit, kesin
> yöntemlere itiyor. `.labs/`'te öğrenildi, doğrulandı.
> **EN** — Three search problems, three answers: binary search for the as-of join; EXACT matmul for
> cleanup (not ANN — the bundle-capacity wall); a RESONATOR network for factorization. The constraints
> push toward simpler, exact methods. Learned and validated in `.labs/`.
> **ZH** — 三个检索问题，三个答案：as-of 连接用二分查找；清理用精确 matmul（非 ANN——捆绑容量墙）；
> 因式分解用共振器网络。约束推向更简单、精确的方法。在 `.labs/` 中学习并验证。

**Status:** ADOPTED. Code: `data/align.asof_searchsorted` · `kernel/cleanup.py` · `kernel/resonator.py`.
Research: 3 parallel lines; learning loop in `.labs/` (gitignored).

## 1. As-of join → `np.searchsorted` (int64, `side='right'-1`)
Binary search, O(N log M), wins the **sparse-left** regime (sparse telemetry vs dense market; M/N > log₂M).
Measured **499× faster** than the two-pointer at N=200, M=2e6; identical results, causal. Trap: a float
query against int64 is **20× slower** — cast to int64 + contiguous. Two-pointer stays the default for
comparable-density streams. (Skip interval/segment trees — as-of is a stabbing query → binary search.)

## 2. Cleanup → exact matmul (NOT ANN)
`Cleanup` = cached normalized codebook + a matmul + argmax (real or complex FHRR). The **bundle-capacity
wall** `M_max ≈ 0.386·D/log2(N)` caps superposition depth, so codebooks stay small enough that the ANN
crossover (N≈50k–200k) is **never reached** — measured N=1k→0.49ms, N=10k→4.9ms. And ANN would break the
**honesty contract**: a silent cleanup miss propagates through every downstream VSA op. Exact is provable;
`bundle_capacity(D, N)` reports the wall.

## 3. Factorization → resonator network (`kernel/resonator.py`)
Recover the factors of `c = f1 ⊙ f2 ⊙ … ⊙ fF` without brute-forcing ∏|codebook|. **What I learned in the
lab:** the canonical Jacobi-from-superposition init STALLS; what converges is **Gauss-Seidel + random
restarts + OLS projection** — 15/15 at M=1k (median 5 iters), 13/15 at M=512k. `factorize` returns
`(indices, verified)`; **verified** recomposes ⊙ and checks cosine to `c` — an unverified result (limit
cycle / above capacity) must not be trusted. Brute force still wins below M≈1e4.

## The through-line
Every answer is exact or honesty-flagged; approximate recall is rejected wherever a silent miss could
propagate. The constraints (numpy-only, D=4096 FHRR, the capacity wall) make the simple method the correct
one — and the resonator is the one genuinely new algorithm, now mastered and graduated from `.labs/`.
