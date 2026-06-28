// The review loop, split for judgment-before-commit.
//   extract()  → returns reviewable candidates WITHOUT saving (the "Run").
//   commit()   → saves ONLY the snippets you approved.
// This is the curation loop the UI inhabits: keep/reject/edit, then learn the approved set.

import type { Assumption, GoalProfile, GoalScore, Placement, Snippet, SnippetKind, StoredSnippet } from "./types.ts";
import type { InferenceAdapter } from "../adapters/inference/index.ts";
import type { Library } from "../library/index.ts";
import type { Ontology } from "../ontology/graph.ts";
import { intake } from "./intake.ts";
import { gate } from "../assumptions/index.ts";
import { distillFragment } from "../snippets/index.ts";
import { heuristicScore } from "../evaluator/index.ts";
import { nowISO, shortHash } from "./util.ts";

export interface Candidate {
  id: string;
  kind: SnippetKind;
  gloss: string;
  move: string | null;
  sourceFragmentId: string;
  source: string;
  placement: Placement;
  score: GoalScore;
  engine: string;
}

export interface RejectedFragment {
  fragmentId: string;
  text: string;
  failedAssumption: string | null;
  reason: string;
}

export interface ExtractResult {
  engine: string;
  candidates: Candidate[];
  rejected: RejectedFragment[];
}

export interface ExtractOptions {
  text: string;
  spans?: Array<{ start: number; end: number }>;
  inference: InferenceAdapter;
  ontology: Ontology;
  assumptions: Assumption[];
  goal: GoalProfile;
  genaiFilter?: (text: string) => Promise<{ pass: boolean; reason: string }>;
  bypassGate?: boolean; // "override & keep locally" re-runs a rejected fragment
}

function applySpans(text: string, spans?: Array<{ start: number; end: number }>): string {
  if (!spans || !spans.length) return text;
  return spans
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start)
    .map((s) => text.slice(s.start, s.end).trim())
    .filter(Boolean)
    .join("\n");
}

export async function extract(opts: ExtractOptions): Promise<ExtractResult> {
  const text = applySpans(opts.text, opts.spans);
  const fragments = intake(text);
  const candidates: Candidate[] = [];
  const rejected: RejectedFragment[] = [];

  for (const f of fragments) {
    if (!opts.bypassGate) {
      const verdict = gate(f.text, opts.assumptions);
      if (!verdict.pass) {
        rejected.push({ fragmentId: f.id, text: f.text, failedAssumption: verdict.failedAssumption, reason: verdict.reason });
        continue;
      }
      if (opts.genaiFilter) {
        try {
          const v = await opts.genaiFilter(f.text);
          if (!v.pass) {
            rejected.push({ fragmentId: f.id, text: f.text, failedAssumption: "genai", reason: "genai: " + (v.reason || "filtered") });
            continue;
          }
        } catch { /* model error → don't block */ }
      }
    }
    const snippets = await distillFragment(f, { goal: opts.goal }, opts.inference);
    for (const s of snippets) {
      const vector = opts.ontology.vectorFor(s);
      const placement = opts.ontology.position(s, vector);
      const score = heuristicScore(s, placement, opts.goal); // fast, model-free scoring
      candidates.push({
        id: s.id, kind: s.kind, gloss: s.gloss, move: s.move,
        sourceFragmentId: f.id, source: f.text, placement, score, engine: opts.inference.id,
      });
    }
  }
  return { engine: opts.inference.id, candidates, rejected };
}

export interface ApprovedSnippet {
  kind: SnippetKind;
  gloss: string;
  move: string | null;
  tags?: string[];
  source?: string;
}

// Save only the approved set; grow the ontology so the next run is judged against it.
export function commit(approved: ApprovedSnippet[], library: Library, ontology: Ontology): StoredSnippet[] {
  const saved: StoredSnippet[] = [];
  for (const a of approved) {
    const gloss = (a.gloss || "").trim();
    if (!gloss) continue;
    const snippet: Snippet = {
      id: `${a.kind}-${shortHash(gloss.toLowerCase())}`,
      kind: a.kind,
      gloss,
      move: a.move ?? null,
      tags: a.tags ?? [],
      source: a.source ?? "",
      createdAt: nowISO(),
    };
    const vector = ontology.vectorFor(snippet);
    const placement = ontology.position(snippet, vector);
    const prior = library.get(snippet.id);
    const stored: StoredSnippet = {
      ...snippet,
      vector,
      placement,
      score: { keep: true, score: 1, why: "kept by you" },
      optInShare: prior?.optInShare ?? false,
    };
    ontology.add(stored);
    library.save(stored);
    saved.push(stored);
  }
  return saved;
}
