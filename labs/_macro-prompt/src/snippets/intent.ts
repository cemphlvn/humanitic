// Intent-snippet module — dense sentences that carry a specific reasoning move.
// Reason to change: the catalogue of reasoning moves and how dense sentences are picked.

import type { Fragment, Snippet } from "../core/types.ts";
import type { DistillContext, RawSnippet, SnippetAdapter } from "./index.ts";
import { contentWords } from "../core/util.ts";

// The reasoning moves an intent-snippet can carry — the heart of the research framing.
const CUES: Array<[RegExp, string]> = [
  [/\b(because|since|due to|as a result)\b/i, "causal-justification"],
  [/\b(so that|in order to|so as to|to ensure)\b/i, "purpose-framing"],
  [/\b(first|second|then|next|finally|step[ -]?by[ -]?step)\b/i, "sequential-decomposition"],
  [/\b(compare|contrast|versus|vs\.?|rather than|whereas|trade-?offs?)\b/i, "comparative-analysis"],
  [/\b(must|should|never|always|avoid|do not|don'?t|ensure|only)\b/i, "constraint-setting"],
  [/\b(for example|e\.g\.|such as|for instance)\b/i, "exemplification"],
  [/\b(if|when|unless|whenever|in case)\b/i, "conditional-branching"],
  [/\b(prefer|instead|favou?r|default to)\b/i, "preference-steering"],
];

const IMPERATIVES = new Set(
  ("create build use make write extract compare keep ensure avoid separate distill design return " +
    "focus consider analyze pay treat think split modulate position reject filter")
    .split(" "),
);

function detectMove(sentence: string): string | null {
  for (const [re, label] of CUES) if (re.test(sentence)) return label;
  const first = sentence.trim().toLowerCase().split(/\s+/)[0]?.replace(/[^a-z]/g, "");
  if (first && IMPERATIVES.has(first)) return "directive";
  return null;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function truncate(s: string, max = 240): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

export const intentAdapter: SnippetAdapter = {
  kind: "intent",
  label: "Intent-snippet",
  description: "A dense sentence carrying one reasoning move — intent, style, and alignment in one line.",

  system:
    "You distill macro-prompts into intent-snippets: dense, reusable sentences that each carry a " +
    "single reasoning move (e.g. causal-justification, purpose-framing, sequential-decomposition, " +
    "comparative-analysis, constraint-setting, conditional-branching, preference-steering, " +
    "exemplification, directive). Keep the sentence dense and reusable. Return only the JSON object.",

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
          required: ["gloss", "move", "tags"],
          properties: {
            gloss: { type: "string", description: "a dense, reusable sentence carrying one reasoning move" },
            move: { type: "string", description: "the reasoning move label" },
            tags: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },

  prompt(fragment: Fragment, _ctx: DistillContext): string {
    return (
      "Extract up to 3 intent-snippets from this prompt fragment. Each is a dense sentence that " +
      "carries one reasoning move; label the move.\n\n---\n" +
      fragment.text +
      "\n---"
    );
  },

  heuristic(fragment: Fragment): RawSnippet[] {
    const sentences = splitSentences(fragment.text);
    const scored = sentences.map((s) => {
      const move = detectMove(s);
      const wc = s.split(/\s+/).length;
      const density = contentWords(s).length / Math.max(1, wc);
      const lengthOk = wc >= 6 && wc <= 45;
      const score = (move ? 0.5 : 0) + (lengthOk ? 0.2 : 0) + density * 0.4;
      return { s, move, score, wc };
    });
    return scored
      .filter((x) => x.move || (x.wc >= 6 && x.wc <= 45))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => ({ gloss: truncate(x.s), move: x.move ?? "directive", tags: [] }));
  },

  normalize(raw: RawSnippet): RawSnippet | null {
    const gloss = truncate((raw.gloss ?? "").trim().replace(/\s+/g, " "));
    if (gloss.split(/\s+/).filter(Boolean).length < 4) return null;
    return { gloss, move: (raw.move ?? "").trim() || "directive", tags: raw.tags ?? [] };
  },

  render(s: Snippet): string {
    return `▸ "${s.gloss}"  ⟶ ${s.move ?? "directive"}`;
  },
};
