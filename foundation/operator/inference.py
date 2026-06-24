"""
inference — the local-inference seam. The LLM PROPOSES; numpy/MLX EXECUTES (the LLM is kept OFF the
hot numeric path, preserving the kernel's measured guarantees). The default is the OfflineStub
(deterministic, no model / no network), so the autonomous loop is fully testable offline; the runtime
swaps to a local OpenAI-compatible server (MLX-LM `mlx_lm.server` or Ollama `/v1`) via the factory.

Best practice (research): a narrow Protocol, an offline stub default, temperature=0 + structured
(schema) outputs, engine chosen by env var. Determinism = stable shape, not bit-exact.
"""
import os


class OfflineStub:
    """Deterministic, no model, no network. Returns a schema-valid operator action."""
    name = "stub"

    def propose(self, thesis, context=None):
        # a canned, schema-valid "engineer a strategy" action (a trigram genome)
        return {"action": "compile_strategy",
                "trigram": ["regime:trending", "edge:momentum", "risk:capped"],
                "rationale": "stub: momentum in a trending regime, conservatively capped"}


class LocalServerEngine:
    """RUNTIME: an OpenAI-compatible local LLM server (mlx_lm.server / Ollama / llama-server).
    temperature=0, structured output. Not exercised offline — raises until a server is configured."""
    name = "local-server"

    def __init__(self, base_url=None, model=None):
        self.base_url = base_url or os.getenv("ARK_LLM_URL")
        self.model = model or os.getenv("ARK_LLM_MODEL")

    def propose(self, thesis, context=None):
        raise RuntimeError("LocalServerEngine needs a running local LLM server "
                           "(set ARK_INFERENCE=mlx|ollama + ARK_LLM_URL/ARK_LLM_MODEL)")


def get_engine(mode=None):
    """Factory keyed by ARK_INFERENCE (default 'stub' for CI/offline)."""
    mode = (mode or os.getenv("ARK_INFERENCE", "stub")).lower()
    return OfflineStub() if mode == "stub" else LocalServerEngine()
