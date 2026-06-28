// Inference adapter seam — the "one brain", swappable like an SDK backend.
//
// Reason to change: which ENGINE runs (Claude Agent SDK today, local MLX/SLM later).
// NOT the research method — that lives in the snippet/evaluator/share modules, which
// supply BOTH an LLM recipe (system/prompt/jsonSchema) and an offline recipe (fallback)
// in a single call. The adapter just decides which to honor. That is what makes the
// engine genuinely swappable: callers never branch on "is this offline or LLM".

export interface CompleteRequest<T> {
  task: string; // label for logging, e.g. "distill:concept"
  system?: string;
  prompt: string;
  jsonSchema: object; // JSON Schema for structured output (root must be an object)
  fallback: () => T | Promise<T>; // deterministic offline recipe
  maxTokens?: number;
}

export interface InferenceAdapter {
  id: string;
  online: boolean; // true if it calls a remote model
  complete<T>(req: CompleteRequest<T>): Promise<T>;
}

import { HeuristicAdapter } from "./heuristic.ts";
import { ClaudeAdapter } from "./claude.ts";
import { MlxAdapter } from "./mlx.ts";
import { ServerAdapter } from "./server.ts";
import { mlxRuntimeStatus } from "../../models/local.ts";

export type EngineName = "heuristic" | "claude" | "mlx" | "server";

// Resolve the engine. Default is heuristic (offline by construction, the ethic).
// Claude and MLX are opt-in via --engine or MPL_ENGINE.
export async function selectEngine(name?: string): Promise<InferenceAdapter> {
  const want = (name || process.env.MPL_ENGINE || "heuristic").toLowerCase();
  if (want === "claude") {
    const adapter = await ClaudeAdapter.tryCreate();
    if (adapter) return adapter;
    process.stderr.write(
      "[mpl] claude engine unavailable (no @anthropic-ai/sdk or no ANTHROPIC_API_KEY) — falling back to heuristic.\n",
    );
  }
  if (want === "mlx") {
    const adapter = await MlxAdapter.tryCreate();
    if (adapter) return adapter;
  }
  if (want === "server") {
    const adapter = await ServerAdapter.tryCreate();
    if (adapter) return adapter;
    process.stderr.write(
      "[mpl] server engine unreachable (no OpenAI-compatible model at MPL_SERVER_URL) — falling back to heuristic.\n",
    );
  }
  return new HeuristicAdapter();
}

// Honest engine status for the UI — what was requested, what resolved, and why.
export interface EngineStatus {
  requested: string;
  resolved: string;
  online: boolean;
  fellBack: boolean;
  model: string | null;
  mlxInstalled: boolean;
  claudeKeyPresent: boolean;
  serverUrl: string | null;
  note: string;
}

export async function engineStatus(name?: string): Promise<EngineStatus> {
  const requested = (name || process.env.MPL_ENGINE || "heuristic").toLowerCase();
  const adapter = await selectEngine(requested);
  const mlx = mlxRuntimeStatus();
  const fellBack = requested !== "heuristic" && adapter.id !== requested;
  const note =
    fellBack && requested === "claude" ? "Claude needs @anthropic-ai/sdk + ANTHROPIC_API_KEY — fell back to heuristic."
    : fellBack && requested === "mlx" ? "MLX needs mlx-lm + a model (MPL_MLX_MODEL) — fell back to heuristic."
    : fellBack && requested === "server" ? "No model server reachable at MPL_SERVER_URL — fell back to heuristic."
    : adapter.id === "heuristic" ? "Offline, deterministic. No model — nothing leaves this machine."
    : adapter.online ? "Remote model — requests leave this machine."
    : "Local model — private, stays on this machine.";
  return {
    requested,
    resolved: adapter.id,
    online: adapter.online,
    fellBack,
    model: process.env.MPL_MODEL || process.env.MPL_MLX_MODEL || null,
    mlxInstalled: mlx.commandFound,
    claudeKeyPresent: !!process.env.ANTHROPIC_API_KEY,
    serverUrl: process.env.MPL_SERVER_URL || null,
    note,
  };
}
