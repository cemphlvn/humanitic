// Warm local-server engine — OpenAI-compatible (mlx_lm.server / Ollama /v1 / LM Studio).
// The model stays loaded between calls (warm), unlike the per-call CLI spawn of the mlx
// adapter. Talks to a server YOU run locally; nothing leaves the machine.
//
//   mlx_lm.server --model <id> --port 8080
//   MPL_SERVER_URL=http://127.0.0.1:8080/v1  node src/cli.ts ... --engine server

import type { CompleteRequest, InferenceAdapter } from "./index.ts";

const base = () => (process.env.MPL_SERVER_URL || "http://127.0.0.1:8080/v1").replace(/\/+$/, "");
const structured = () => process.env.MPL_SERVER_STRUCTURED === "1"; // mlx_lm.server ignores this; ollama/llama-server honor it

function extractJson(text: string): unknown | null {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(text.slice(a, b + 1)); } catch { return null; }
}

export class ServerAdapter implements InferenceAdapter {
  id = "server";
  online = false; // local server — private, not cloud
  private base: string;
  private model: string;

  private constructor(base: string, model: string) {
    this.base = base;
    this.model = model;
  }

  static async tryCreate(): Promise<ServerAdapter | null> {
    const root = base();
    try {
      const r = await fetch(root + "/models", { signal: AbortSignal.timeout(2500) });
      if (!r.ok) return null;
      const j = (await r.json()) as { data?: Array<{ id: string }> };
      const model = process.env.MPL_MODEL || j.data?.[0]?.id;
      if (!model) return null;
      return new ServerAdapter(root, model);
    } catch {
      return null;
    }
  }

  async complete<T>(req: CompleteRequest<T>): Promise<T> {
    try {
      const body: Record<string, unknown> = {
        model: this.model,
        messages: [
          ...(req.system ? [{ role: "system", content: req.system }] : []),
          { role: "user", content: req.prompt },
        ],
        max_tokens: req.maxTokens ?? 800,
        temperature: 0,
        stream: false,
      };
      if (structured()) body.response_format = { type: "json_schema", json_schema: { name: "out", schema: req.jsonSchema } };
      const r = await fetch(this.base + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      });
      if (!r.ok) return await req.fallback();
      const j = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = j.choices?.[0]?.message?.content;
      if (typeof content !== "string") return await req.fallback();
      const parsed = extractJson(content);
      return (parsed ?? (await req.fallback())) as T;
    } catch (err) {
      process.stderr.write(`[mpl] server complete(${req.task}) failed: ${String(err)} — using fallback.\n`);
      return await req.fallback();
    }
  }
}
