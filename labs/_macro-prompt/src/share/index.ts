// Knowledge Share Composer + Optional Public Commons — opt-in only.
//
// Reason to change: privacy and governance. The publish gate's default is "nothing
// leaves"; the exception is per-snippet, de-identified, opt-in. The raw prompt
// (snippet.source) is NEVER included in a Share, and a guard re-checks the abstract
// for anything sensitive before it is allowed into the commons.

import type { StoredSnippet } from "../core/types.ts";
import type { InferenceAdapter } from "../adapters/inference/index.ts";
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { nowISO, shortHash } from "../core/util.ts";
import { findSensitive, scrub } from "../core/patterns.ts";

export interface Share {
  id: string;
  kind: StoredSnippet["kind"];
  relation: string;
  move: string | null;
  abstract: string; // de-identified, generalized — the only thing that travels
  tags: string[];
  attribution: "HUMANITIK";
  createdAt: string;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["abstract", "tags"],
  properties: {
    abstract: { type: "string", description: "a de-identified, generalized restatement of the snippet" },
    tags: { type: "array", items: { type: "string" } },
  },
};

export async function compose(stored: StoredSnippet, inference: InferenceAdapter): Promise<Share> {
  const { abstract, tags } = await inference.complete<{ abstract: string; tags: string[] }>({
    task: "anonymize",
    system:
      "You turn a private prompt-snippet into a de-identified, abstracted contribution for an open " +
      "research commons. Remove any identity, project, or personal specifics; keep only the reusable " +
      "linguistic/reasoning pattern. Return only the JSON object.",
    prompt:
      `Snippet (${stored.kind}): "${stored.gloss}"` +
      `${stored.move ? ` [move: ${stored.move}]` : ""}\n` +
      "Produce an abstract (generalized, no specifics) and a few tags.",
    jsonSchema: SCHEMA,
    maxTokens: 512,
    fallback: () => ({
      abstract: scrub(stored.gloss),
      tags: [...new Set([stored.kind, stored.placement.relation, ...(stored.move ? [stored.move] : []), ...stored.tags])],
    }),
  });

  return {
    id: `share-${shortHash(abstract.toLowerCase())}`,
    kind: stored.kind,
    relation: stored.placement.relation,
    move: stored.move,
    abstract: abstract.trim(),
    tags,
    attribution: "HUMANITIK",
    createdAt: nowISO(),
  };
}

// The publish guard: a share never reaches the commons if anything sensitive survived.
export function guard(share: Share): { ok: boolean; reason: string } {
  const hits = findSensitive(share.abstract);
  if (hits.length) return { ok: false, reason: `abstract still contains: ${hits.join(", ")}` };
  if (!share.abstract.trim()) return { ok: false, reason: "empty abstract" };
  return { ok: true, reason: "clean" };
}

export function publish(share: Share, commonsDir: string): void {
  const check = guard(share);
  if (!check.ok) throw new Error(`publish blocked — ${check.reason}`);
  mkdirSync(commonsDir, { recursive: true });
  appendFileSync(join(commonsDir, "commons.jsonl"), JSON.stringify(share) + "\n");
}
