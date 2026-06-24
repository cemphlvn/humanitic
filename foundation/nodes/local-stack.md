# Node — The Local Stack (setup · RLinf · RoboTwin · the local model)

> **TR** — `setup.sh` ile yerel kurulum: küresel varsayılan (~/.ark) · özel `.local` · Keychain
> sırları · RLinf (eğitim, uzak NVIDIA) · RoboTwin (simülatör, uzak) · yerel model (WideSeek-R1-4b).
> **EN** — `setup.sh` configures the local stack: global default (~/.ark) · private `.local` · Keychain
> secrets · RLinf (training, remote NVIDIA) · RoboTwin (simulator, remote) · the local model.
> **ZH** — `setup.sh` 配置本地栈：全局默认（~/.ark）· 私有 `.local` · 钥匙串密钥 · RLinf（训练，远程
> NVIDIA）· RoboTwin（仿真器，远程）· 本地模型。

**Status:** ADOPTED. Code: `setup.sh`, `foundation/machine.py`, `foundation/training/rlinf.py`.

## What runs where (the Mac/remote split)
| component | role | where it runs |
|---|---|---|
| macro-kernel substrate (VSA/MLX, court, autonomous) | engineer/prove/paper-trade | **this Mac** (Metal, numpy/MLX) |
| local model — **`RLinf/WideSeek-R1-4b`** (4B, 4-bit MLX ≈ 2.5GB) | the operator's reasoning engine | **this Mac** (mlx_lm / llama.cpp) |
| **RLinf** (PPO/GRPO/SAC/IQL, FSDP+Megatron) | *train* the operator/regime | **remote NVIDIA** (CUDA; not Metal) |
| **RoboTwin** (bimanual sim, 100k+ trajectories) | embodied sim/data for RL | **remote NVIDIA** (Linux) |

RLinf is almost all GPU VLA/robotics models; the **one Mac-runnable** text/reasoning model is
`RLinf/WideSeek-R1-4b` — set as the recommended `inference.model` in `ark.machine.example.yaml`.
Convert it: `mlx_lm.convert --hf-path RLinf/WideSeek-R1-4b -q`, then `ARK_INFERENCE=mlx`.

## The reward loop (RLinf ⟷ ark)
RLinf trains the operator; **ark's evidence court is the reward function** — a strategy's RL reward is
*deployment-consistent honesty*: positive OOS excess edge-in-bits, no look-ahead leak, passes the
critic, survives paper across broker partners. RL optimizes for surviving the court, not for backtest
theatre.

## setup.sh (great UX, recommended defaults, fully flexible)
```bash
./setup.sh --dry-run      # preview every action; change nothing
./setup.sh                # interactive, recommended defaults
./setup.sh -y --no-rlinf  # non-interactive, skip RLinf
```
Steps: preflight → global default (`~/.ark`) → `.local` scaffold (Article 0) → Keychain secrets (you
add the values) → RLinf clone+config+register → verify (selftest + run_health). Idempotent.
