// The Distillation Loop — OBSERVE → GATE → DISTILL → POSITION → EVALUATE → COMMIT.
//
// This orchestrator wires the modules. It owns no domain rules itself — that keeps each
// module's "reason to change" isolated. Both kept and rejected work feed remembrance:
// a rejection is a result, not a defeat.

import type { Assumption, GateVerdict, GoalProfile, Placement, Snippet, GoalScore, StoredSnippet } from "./types.ts";
import type { InferenceAdapter } from "../adapters/inference/index.ts";
import type { Library } from "../library/index.ts";
import type { Ontology } from "../ontology/graph.ts";
import type { Remembrance } from "./remembrance.ts";
import { intake } from "./intake.ts";
import { gate } from "../assumptions/index.ts";
import { distillFragment } from "../snippets/index.ts";
import { evaluate } from "../evaluator/index.ts";

export interface KeptResult {
  snippet: Snippet;
  placement: Placement;
  score: GoalScore;
  saved: boolean;
}

export interface DroppedResult {
  snippet: Snippet;
  placement: Placement;
  score: GoalScore;
}

export interface RejectedResult {
  fragment: string;
  verdict: GateVerdict;
}

export interface LoopReport {
  engine: string;
  fragmentCount: number;
  rejected: RejectedResult[];
  kept: KeptResult[];
  dropped: DroppedResult[];
}

export interface LoopOptions {
  text: string;
  inference: InferenceAdapter;
  library: Library;
  ontology: Ontology;
  assumptions: Assumption[];
  goal: GoalProfile;
  save: boolean;
  remembrance: Remembrance;
  optInShare?: boolean; // mark newly kept snippets opt-in for later contribution
}

export async function runLoop(opts: LoopOptions): Promise<LoopReport> {
  const { text, inference, library, ontology, assumptions, goal, save, remembrance } = opts;
  const optInShare = opts.optInShare ?? false;
  const report: LoopReport = {
    engine: inference.id,
    fragmentCount: 0,
    rejected: [],
    kept: [],
    dropped: [],
  };

  const fragments = intake(text);
  report.fragmentCount = fragments.length;

  for (const fragment of fragments) {
    // GATE — admission, with a named reason on failure.
    const verdict = gate(fragment.text, assumptions);
    if (!verdict.pass) {
      report.rejected.push({ fragment: fragment.text, verdict });
      remembrance.log("rejected", verdict.reason, { fragment: fragment.text });
      continue;
    }

    // DISTILL — concept + intent carriers.
    const snippets = await distillFragment(fragment, { goal }, inference);

    for (const snippet of snippets) {
      // POSITION — place in the ontology manifold.
      const vector = ontology.vectorFor(snippet);
      const placement = ontology.position(snippet, vector);

      // EVALUATE — does it move the goal?
      const score = await evaluate(snippet, placement, goal, inference);

      if (!score.keep) {
        report.dropped.push({ snippet, placement, score });
        if (save) remembrance.log("dropped", score.why, { gloss: snippet.gloss, kind: snippet.kind });
        continue;
      }

      // COMMIT — keep privately; grow the ontology for the next pass.
      const prior = library.get(snippet.id);
      const stored: StoredSnippet = {
        ...snippet,
        vector,
        placement,
        score,
        optInShare: (prior?.optInShare ?? false) || optInShare,
      };
      ontology.add(stored);
      if (save) {
        library.save(stored);
        remembrance.log("kept", `${snippet.kind} kept (${placement.relation})`, { gloss: snippet.gloss });
      }
      report.kept.push({ snippet, placement, score, saved: save });
    }
  }

  return report;
}
