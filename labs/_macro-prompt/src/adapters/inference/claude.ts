// Claude engine — distillation through the Anthropic SDK with structured outputs.
//
// The verbatim said "you can use agents sdk (easily swappable)". The distillation
// calls here are well-scoped structured completions (gate-passed fragment -> typed
// snippets / score / abstract), so the right Anthropic surface is the Messages API
// with structured outputs (output_config.format) — deterministic and schema-validated.
// The adapter seam is what makes it swappable: drop in the Claude Agent SDK's query(),
// a local MLX model, or anything else without touching the modules that call it.
//
// The SDK is an OPTIONAL dependency, imported lazily via a non-literal specifier so
// neither typecheck nor the offline path needs it installed.

import type { CompleteRequest, InferenceAdapter } from "./index.ts";

const MODEL = process.env.MPL_MODEL || "claude-opus-4-8";

export class ClaudeAdapter implements InferenceAdapter {
  id = "claude";
  online = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  private constructor(client: unknown) {
    this.client = client;
  }

  static async tryCreate(): Promise<ClaudeAdapter | null> {
    if (!process.env.ANTHROPIC_API_KEY) return null;
    try {
      const specifier = "@anthropic-ai/sdk";
      // Non-literal specifier: TS treats the module as `any`, so this file
      // typechecks and runs without the package present.
      const mod: any = await import(specifier);
      const Anthropic = mod.default ?? mod.Anthropic;
      return new ClaudeAdapter(new Anthropic());
    } catch {
      return null;
    }
  }

  async complete<T>(req: CompleteRequest<T>): Promise<T> {
    try {
      const res = await this.client.messages.create({
        model: MODEL,
        max_tokens: req.maxTokens ?? 2048,
        system: req.system,
        messages: [{ role: "user", content: req.prompt }],
        output_config: { format: { type: "json_schema", schema: req.jsonSchema } },
      });
      if (res.stop_reason === "refusal") return await req.fallback();
      const block = res.content.find((b: { type: string }) => b.type === "text");
      if (!block?.text) return await req.fallback();
      return JSON.parse(block.text) as T;
    } catch (err) {
      process.stderr.write(`[mpl] claude complete(${req.task}) failed: ${String(err)} — using fallback.\n`);
      return await req.fallback();
    }
  }
}
