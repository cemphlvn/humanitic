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

export type EngineName = "heuristic" | "claude";

// Resolve the engine. Default is heuristic (offline by construction, the ethic).
// Claude is opt-in via --engine claude or MPL_ENGINE=claude.
export async function selectEngine(name?: string): Promise<InferenceAdapter> {
  const want = (name || process.env.MPL_ENGINE || "heuristic").toLowerCase();
  if (want === "claude") {
    const adapter = await ClaudeAdapter.tryCreate();
    if (adapter) return adapter;
    process.stderr.write(
      "[mpl] claude engine unavailable (no @anthropic-ai/sdk or no ANTHROPIC_API_KEY) — falling back to heuristic.\n",
    );
  }
  return new HeuristicAdapter();
}
