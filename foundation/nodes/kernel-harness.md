# Node — The Agentic Kernel Harness (fusion)

> **TR** — Ajansal çekirdek döngüsü: bir ajan çekirdek adayları ÖNERİR; bu koşum doğruluk kâhinine
> karşı DENETLER, KIYASLAR, en iyiyi TUTAR. Kovaladığı kazanç FÜZYON: bağla-sonra-indirge tek geçişte.
> **EN** — The agentic kernel loop: an agent PROPOSES candidate kernels; this harness CHECKS them
> against a correctness oracle, BENCHMARKS, KEEPS THE BEST. The win it chases is FUSION: bind-then-reduce
> in one pass over memory.
> **ZH** — 智能体内核循环：智能体提出候选内核；本框架对照正确性预言机校验、基准测试、保留最优。
> 它追逐的收益是融合：bind 后 reduce 在一次内存遍历中完成。

**Status:** ADOPTED. Code: `foundation/kernel/harness.py`. Grounding: `learnings-accelerator-stack`.

## The loop (KernelBench / KernelEvolve shape)
```
agent proposes candidate kernels  →  run_loop:  for each:  check vs oracle  →  bench (if correct)
                                                  keep the fastest CORRECT one
```
The harness is the **deterministic fitness core**: it never trusts a candidate's speed without first
proving it computes the reference result (the correctness oracle is the gate, exactly as the leakage
guard gates a backtest). An agent (operator layer, behind the `InferenceEngine` seam — AgentKit /
LangChain / OpenAI-Agents, the operator's choice) supplies the candidates; the harness scores them.

## The fusion win
A bandwidth-bound VSA composite — *bind two phase vectors, then reduce* — materializes an intermediate
`bound = a + b` when **unfused** (an extra pass over D values). **Fused** into one expression, the
runtime makes one pass. On numpy the win is small (eager, no fusion); on **MLX**, `mx.compile` fuses
the `bind → cos → reduce` chain into a single Metal kernel — fewer launches, fewer memory passes — and
the fused path pulls ahead as D grows (the same bandwidth thesis as `vsa_mlx`). This is the kernel-
engineering edge: *who compiles best*, not who hand-writes the fastest kernel.
