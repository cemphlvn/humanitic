// Shared data shapes for the Distillation Loop.
// Pure types only — no behavior, so every module can import without cycles.

export type SnippetKind = "concept" | "intent";

export interface Fragment {
  id: string;
  index: number;
  text: string;
}

// A nano-snippet: the tiny nuance carrier distilled from a macro-prompt.
export interface Snippet {
  id: string;
  kind: SnippetKind;
  gloss: string; // the carrier itself: 2-3 words (concept) or a dense sentence (intent)
  move: string | null; // intent only: the reasoning move it carries
  tags: string[];
  source: string; // the fragment it came from — stays .local, never shared
  createdAt: string;
}

export type Relation =
  | "novel" // nothing like it in the ontology yet
  | "similar" // close to something known
  | "contradictory" // close in surface but opposite in polarity
  | "redundant" // effectively a duplicate
  | "valuable"; // related but adds a distinct angle

export interface Placement {
  relation: Relation;
  nearestId: string | null;
  nearestScore: number;
  neighbors: Array<{ id: string; score: number }>;
}

export interface GateVerdict {
  pass: boolean;
  failedAssumption: string | null; // names which assumption failed (no silent drops)
  reason: string;
}

export interface GoalScore {
  keep: boolean;
  score: number; // 0..1 — does this snippet move the research goal?
  why: string;
}

export interface StoredSnippet extends Snippet {
  vector: number[];
  placement: Placement;
  score: GoalScore;
  optInShare: boolean;
}

// An assumption is explicit and auditable: it tests a fragment and either
// passes (returns null) or fails (returns the reason it failed).
export interface Assumption {
  id: string;
  scope: "private" | "public";
  statement: string;
  test: (text: string) => string | null;
}

export interface GoalProfile {
  id: string;
  objective: string;
  keywords: string[];
  keepThreshold: number; // a snippet is kept when score >= this
}
