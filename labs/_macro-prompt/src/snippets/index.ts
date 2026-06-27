// Snippet adapters — the product's main magic, modulated for a clean mind.
//
// Reason to change: a snippet KIND's shape or extraction. concept-snippets and
// intent-snippets are different things (2-3 word ideas vs dense reasoning moves), so
// each is its own module behind a shared contract — the adapter approach, like SDK
// plugins. New kinds register here without touching the loop.

import type { Fragment, GoalProfile, Snippet, SnippetKind } from "../core/types.ts";
import type { InferenceAdapter } from "../adapters/inference/index.ts";
import { nowISO, shortHash } from "../core/util.ts";

export interface RawSnippet {
  gloss: string;
  move?: string | null;
  tags?: string[];
}

export interface DistillContext {
  goal: GoalProfile;
}

export interface SnippetAdapter {
  kind: SnippetKind;
  label: string;
  description: string;
  system: string;
  jsonSchema: object; // structured-output schema, root object { snippets: [...] }
  prompt: (fragment: Fragment, ctx: DistillContext) => string;
  heuristic: (fragment: Fragment) => RawSnippet[]; // offline extraction
  normalize: (raw: RawSnippet) => RawSnippet | null; // clean / reject malformed
  render: (s: Snippet) => string;
}

import { conceptAdapter } from "./concept.ts";
import { intentAdapter } from "./intent.ts";

// The registry — order is display order. Add a kind by appending here.
export const registry: SnippetAdapter[] = [conceptAdapter, intentAdapter];

export function adapterFor(kind: SnippetKind): SnippetAdapter {
  const a = registry.find((r) => r.kind === kind);
  if (!a) throw new Error(`no snippet adapter for kind: ${kind}`);
  return a;
}

function toSnippet(adapter: SnippetAdapter, fragment: Fragment, raw: RawSnippet): Snippet {
  const gloss = raw.gloss.trim();
  return {
    id: `${adapter.kind}-${shortHash(gloss.toLowerCase())}`,
    kind: adapter.kind,
    gloss,
    move: raw.move ?? null,
    tags: (raw.tags ?? []).map((t) => t.trim()).filter(Boolean),
    source: fragment.text,
    createdAt: nowISO(),
  };
}

// Distill one fragment through every registered snippet adapter.
// Each adapter supplies the LLM recipe AND the offline fallback in one call,
// so the engine choice is fully encapsulated by the inference adapter.
export async function distillFragment(
  fragment: Fragment,
  ctx: DistillContext,
  inference: InferenceAdapter,
): Promise<Snippet[]> {
  const out: Snippet[] = [];
  const seen = new Set<string>();
  for (const adapter of registry) {
    const result = await inference.complete<{ snippets: RawSnippet[] }>({
      task: `distill:${adapter.kind}`,
      system: adapter.system,
      prompt: adapter.prompt(fragment, ctx),
      jsonSchema: adapter.jsonSchema,
      maxTokens: 2048,
      fallback: () => ({ snippets: adapter.heuristic(fragment) }),
    });
    for (const raw of result.snippets ?? []) {
      const cleaned = adapter.normalize(raw);
      if (!cleaned || !cleaned.gloss?.trim()) continue;
      const snippet = toSnippet(adapter, fragment, cleaned);
      if (seen.has(snippet.id)) continue;
      seen.add(snippet.id);
      out.push(snippet);
    }
  }
  return out;
}
