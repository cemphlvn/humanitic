# Node — The Unified Regime Kernel (markets ⟷ embodiment)

> **TR** — Tek bir gizli-rejim çekirdeği: VSA + JEPA hem PİYASA rejimlerini hem GÖMÜLÜ (robotik)
> durumları işler. VLA modelleri (Pi0/Gr00t/OpenVLA) eylem başlıklarıdır. Tek altyapı, çok başlık.
> **EN** — One latent-regime kernel: VSA + JEPA serve both MARKET regimes and EMBODIED (robotic) states.
> The VLA models (Pi0/Gr00t/OpenVLA) are the action heads. One substrate, many heads.
> **ZH** — 一个潜在机制内核：VSA + JEPA 同时服务于市场机制与具身（机器人）状态。VLA 模型（Pi0/Gr00t/
> OpenVLA）是动作头。一个底座，多个头。

**Status:** ADOPTED. Code: `foundation/regime/embodied.py` · `foundation/operator/vla.py`.

## Yes — it fuses (the structural reason)
The VSA primitives (`bind`/`bundle`/`cleanup`) and JEPA-lite are **domain-agnostic**: a market regime
and a robot's scene state are both just *latent regimes*. So the same kernel and the same conservation
accounting run both:

| | market | embodied |
|---|---|---|
| features → | macro (inflation, rates, liquidity) | scene (phase, gripper, object) |
| **VSA regime** (shared) | `encode_regime` | `encode_embodied` (same call) |
| **JEPA-lite** (shared) | next regime ∣ macro event | next state ∣ action event (same `fit`) |
| policy head | weight vector `w_t` (strategy) | action (**VLA**: Pi0/Gr00t/OpenVLA) |
| conservation | edge in bits, capacity `C(D)`, KAM | the *same* held-information accounting |

`test_embodied` proves it: the **same** `jepa.fit` trained on a VLA-like latent stream beats persistence
by ≥10pp — no new world-model code, because the regime kernel already generalizes.

## Where it runs (the fusion's split)
- **VSA + JEPA regime layer → local (Mac, Metal/MLX).** Memory-bound primitives, fused via the kernel
  harness (`mx.compile` fuses `bind → reduce` into one Metal kernel — the same fused op for either domain).
- **VLA action policies → remote NVIDIA.** Pi0/Gr00t/OpenVLA are GPU models; they raise locally and run
  on the remote cluster. **RLinf** trains them; **RoboTwin** simulates; the reward is deployment-consistent
  (a market strategy survives the court; an embodied policy survives the sim).

One substrate, two worlds: the macro-kernel that engineers honest market strategies is the *same* latent
machine that, with a VLA head on remote GPU, drives an honest embodied policy.
