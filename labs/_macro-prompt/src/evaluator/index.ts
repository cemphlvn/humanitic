// Research Goal Evaluator — EVALUATE.
//
// Reason to change: the goal profile and how "does this improve the goal?" is scored.
// The goal is the user's to set and to see; no hidden objective steers what's kept.

import type { GoalProfile, GoalScore, Placement, Snippet } from "../core/types.ts";
import type { InferenceAdapter } from "../adapters/inference/index.ts";
import { clamp } from "../core/util.ts";

const RELATION_BASE: Record<Placement["relation"], number> = {
  novel: 0.7,
  valuable: 0.8,
  contradictory: 0.6, // surfacing a contradiction is useful
  similar: 0.45,
  redundant: 0.15,
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["keep", "score", "why"],
  properties: {
    keep: { type: "boolean" },
    score: { type: "number", description: "0..1, how much this snippet moves the research goal" },
    why: { type: "string" },
  },
};

export function heuristicScore(snippet: Snippet, placement: Placement, goal: GoalProfile): GoalScore {
  const base = RELATION_BASE[placement.relation];
  const hay = `${snippet.gloss} ${snippet.move ?? ""} ${snippet.source}`.toLowerCase();
  const hits = goal.keywords.filter((k) => hay.includes(k.toLowerCase())).length;
  const overlap = Math.min(0.2, hits * 0.05);
  const moveBonus = snippet.kind === "intent" && snippet.move && snippet.move !== "directive" ? 0.1 : 0;
  const conceptBonus =
    snippet.kind === "concept" && snippet.gloss.split(" ").length >= 2 ? 0.05 : 0;
  const score = clamp(base + overlap + moveBonus + conceptBonus);
  const keep = score >= goal.keepThreshold;
  const why =
    `${placement.relation} (base ${base.toFixed(2)})` +
    `${overlap ? `, +${overlap.toFixed(2)} goal-overlap` : ""}` +
    `${moveBonus ? `, +${moveBonus} move` : ""}` +
    `${conceptBonus ? `, +${conceptBonus} concept` : ""}` +
    ` → ${score.toFixed(2)} ${keep ? "≥" : "<"} ${goal.keepThreshold} threshold`;
  return { keep, score: Number(score.toFixed(3)), why };
}

export async function evaluate(
  snippet: Snippet,
  placement: Placement,
  goal: GoalProfile,
  inference: InferenceAdapter,
): Promise<GoalScore> {
  return inference.complete<GoalScore>({
    task: "evaluate",
    system:
      "You judge whether a nano-snippet improves a stated research goal. Score 0..1 and decide keep. " +
      "Return only the JSON object.",
    prompt:
      `Research goal: ${goal.objective}\n` +
      `Keep threshold: ${goal.keepThreshold}\n\n` +
      `Snippet (${snippet.kind}): "${snippet.gloss}"` +
      `${snippet.move ? ` [move: ${snippet.move}]` : ""}\n` +
      `Ontology placement: ${placement.relation} (nearest score ${placement.nearestScore})\n\n` +
      "Does this snippet move the goal? Give keep, score (0..1), and a one-line why.",
    jsonSchema: SCHEMA,
    maxTokens: 512,
    fallback: () => heuristicScore(snippet, placement, goal),
  });
}
