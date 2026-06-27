// Concept-snippet module — 2-3 word reusable ideas: the tiny "nuance carriers".
// Reason to change: how concepts are recognized and shaped.

import type { Fragment, Snippet } from "../core/types.ts";
import type { DistillContext, RawSnippet, SnippetAdapter } from "./index.ts";
import { isStopword, words } from "../core/util.ts";

// Build runs of adjacent content words (stopwords break a run), preserving phrasing.
function contentRuns(text: string): string[][] {
  const runs: string[][] = [];
  let cur: string[] = [];
  for (const w of words(text)) {
    if (w.length > 2 && !isStopword(w) && !/^\d+$/.test(w)) {
      cur.push(w);
    } else {
      if (cur.length) runs.push(cur);
      cur = [];
    }
  }
  if (cur.length) runs.push(cur);
  return runs;
}

function candidatePhrases(text: string): string[] {
  const runs = contentRuns(text);
  const counts = new Map<string, number>();
  for (const run of runs) {
    for (const size of [3, 2]) {
      for (let i = 0; i + size <= run.length; i++) {
        const phrase = run.slice(i, i + size).join(" ");
        counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
      }
    }
  }
  // Fallback for short fragments: pair up the first content words.
  if (counts.size === 0) {
    const flat = runs.flat();
    if (flat.length >= 2) counts.set(flat.slice(0, 2).join(" "), 1);
    else if (flat.length === 1) counts.set(flat[0], 1);
  }
  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length || a[0].localeCompare(b[0]))
    .map(([phrase]) => phrase);

  // Greedy de-overlap: skip a phrase that shares 2+ words with one already chosen,
  // so one sentence doesn't spawn a cluster of near-duplicate carriers.
  const chosen: string[] = [];
  const chosenWordSets: Set<string>[] = [];
  for (const phrase of ranked) {
    const ws = new Set(phrase.split(" "));
    const overlaps = chosenWordSets.some((cs) => {
      let shared = 0;
      for (const w of ws) if (cs.has(w)) shared++;
      return shared >= 2;
    });
    if (overlaps) continue;
    chosen.push(phrase);
    chosenWordSets.push(ws);
  }
  return chosen;
}

export const conceptAdapter: SnippetAdapter = {
  kind: "concept",
  label: "Concept-snippet",
  description: "A 2-3 word reusable idea — a dense pointer to a concept you reuse across prompts.",

  system:
    "You distill macro-prompts into concept-snippets: 2-3 word reusable ideas that act as nuance " +
    "carriers. Each must be a genuinely reusable conceptual unit, not a stopword phrase or a full " +
    "instruction. Return only the JSON object.",

  jsonSchema: {
    type: "object",
    additionalProperties: false,
    required: ["snippets"],
    properties: {
      snippets: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["gloss", "tags"],
          properties: {
            gloss: { type: "string", description: "a 2-3 word reusable concept" },
            tags: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },

  prompt(fragment: Fragment, _ctx: DistillContext): string {
    return (
      "Extract up to 4 concept-snippets (each 2-3 words) from this prompt fragment. " +
      "Pick the reusable conceptual carriers, not the surface wording.\n\n---\n" +
      fragment.text +
      "\n---"
    );
  },

  heuristic(fragment: Fragment): RawSnippet[] {
    return candidatePhrases(fragment.text)
      .slice(0, 4)
      .map((gloss) => ({ gloss, tags: [] }));
  },

  normalize(raw: RawSnippet): RawSnippet | null {
    const gloss = (raw.gloss ?? "").trim().replace(/\s+/g, " ");
    const wc = gloss.split(" ").filter(Boolean).length;
    if (wc < 1 || wc > 4 || gloss.length < 3) return null;
    if (/^\d+$/.test(gloss)) return null;
    return { gloss, tags: raw.tags ?? [] };
  },

  render(s: Snippet): string {
    const tags = s.tags.length ? `  [${s.tags.join(", ")}]` : "";
    return `◆ ${s.gloss}${tags}`;
  },
};
