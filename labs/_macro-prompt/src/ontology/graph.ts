// Ontology Graph + Positioning Layer — POSITION.
//
// Reason to change: the long-term knowledge structure and how a new snippet is placed
// in it. Snippets accumulate; each placement reshapes the manifold the next pass is
// judged against (the return edge that makes the pipeline a loop).

import type { Placement, Relation, Snippet, StoredSnippet } from "../core/types.ts";
import { cosine, embed } from "./vector.ts";

const NEGATION = /\b(not|no|never|avoid|don'?t|cannot|can'?t|without|nor|neither)\b/i;

function polarity(text: string): boolean {
  return NEGATION.test(text);
}

export class Ontology {
  private items: StoredSnippet[];
  constructor(existing: StoredSnippet[] = []) {
    this.items = existing;
  }

  vectorFor(s: Snippet): number[] {
    return embed(`${s.gloss} ${s.move ?? ""}`.trim());
  }

  position(s: Snippet, vector: number[]): Placement {
    const peers = this.items.filter((it) => it.kind === s.kind && it.id !== s.id);
    const neighbors = peers
      .map((it) => ({ id: it.id, score: cosine(vector, it.vector), text: it.gloss }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const nearest = neighbors[0] ?? null;
    const nearestScore = nearest ? nearest.score : 0;
    const nearestText = nearest ? nearest.text : "";

    let relation: Relation;
    const polarityMismatch =
      nearest !== null && nearestScore >= 0.78 && polarity(s.gloss) !== polarity(nearestText);

    if (!nearest || nearestScore < 0.45) relation = "novel";
    else if (polarityMismatch) relation = "contradictory";
    else if (nearestScore >= 0.93) relation = "redundant";
    else if (nearestScore >= 0.78) relation = "similar";
    else relation = "valuable";

    return {
      relation,
      nearestId: nearest?.id ?? null,
      nearestScore: Number(nearestScore.toFixed(4)),
      neighbors: neighbors.map((n) => ({ id: n.id, score: Number(n.score.toFixed(4)) })),
    };
  }

  add(s: StoredSnippet): void {
    const i = this.items.findIndex((x) => x.id === s.id);
    if (i >= 0) this.items[i] = s;
    else this.items.push(s);
  }

  has(id: string): boolean {
    return this.items.some((x) => x.id === id);
  }

  all(): StoredSnippet[] {
    return this.items;
  }
}
