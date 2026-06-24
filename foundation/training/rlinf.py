"""
rlinf — the RLinf training adapter (https://github.com/RLinf/RLinf).

RLinf is an open RL INFRASTRUCTURE for embodied + AGENTIC AI (PPO / GRPO / SAC / IQL; PyTorch FSDP +
Megatron-LM + SGLang/vLLM). It is the natural training layer for ark's OPERATOR agent and regime
models — the kind of async/agentic RL the GLM-style agentic-engineering lineage uses.

THE REWARD: ark's evidence court is the reward function. An operator is trained to produce strategies
that SURVIVE the court honestly — positive OOS excess edge-in-bits, no look-ahead leak, passes the
critic, survives paper across broker partners. RL optimizes for deployment-consistent honesty, not
backtest theatre.

PLATFORM: RLinf needs Linux + NVIDIA GPUs (CUDA); it does NOT run on the Mac's Metal GPU. So locally we
CONFIGURE and REGISTER it; training EXECUTES on remote NVIDIA (or RLinf's Docker image on a GPU box).
This adapter holds the recommended config and raises a clear message if you try to train on a Mac.
"""
import sys

RECOMMENDED = {
    "algo": "grpo",                       # GRPO for agentic/reasoning RL (PPO/SAC/IQL also supported)
    "backend": "sglang",                  # inference backend (or vllm)
    "parallel": "fsdp",                   # PyTorch FSDP (+ Megatron-LM for large models)
    "reward": "deployment_consistent",    # reward = survives ark's court (edge-in-bits, no leak, paper)
    "platform": "remote-nvidia",          # CUDA; not the Mac's Metal GPU
}


class RLinfTrainer:
    name = "rlinf"
    kind = "training"

    def __init__(self, config=None, remote=None):
        self.config = {**RECOMMENDED, **(config or {})}
        self.remote = remote              # a configured remote NVIDIA endpoint; None = not configured

    def describe(self):
        return {"name": self.name, "kind": self.kind,
                "capabilities": ["ppo", "grpo", "sac", "iql", "fsdp", "megatron", "agentic-rl",
                                 "embodied-rl"],
                "config": dict(self.config)}

    def train(self, *args, **kwargs):
        """RL training runs on remote NVIDIA — never on the Mac's Metal GPU."""
        if sys.platform == "darwin" and not self.remote:
            raise RuntimeError("RLinf trains on remote NVIDIA (CUDA) — not the Mac's Metal GPU. "
                               "Configure a remote endpoint, or run RLinf's Docker image on a GPU box.")
        raise RuntimeError("RLinf training executes on the configured remote NVIDIA cluster (not local).")
