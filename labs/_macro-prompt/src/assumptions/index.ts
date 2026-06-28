// Assumption gate — GATE. The ethical heart of the loop.
//
// Reason to change: research philosophy and safety policy. Assumptions are explicit
// and auditable on purpose (rule-based, not vibes) — and a rejection always NAMES the
// assumption that failed. No silent drops, no silent edits.

import type { Assumption, GateVerdict, GoalProfile } from "../core/types.ts";
import { contentWords } from "../core/util.ts";
import { findSensitive } from "../core/patterns.ts";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function defaultAssumptions(): Assumption[] {
  return [
    {
      id: "pub:min-substance",
      scope: "public",
      statement: "A fragment needs enough substance to distill (≥ 3 content words).",
      test: (t) => (contentWords(t).length >= 3 ? null : "too little substance to distill"),
    },
    {
      id: "pub:no-secrets",
      scope: "public",
      statement: "Fragments that look like secrets or credentials are never distilled.",
      test: (t) => {
        const hit = findSensitive(t).filter((n) => n === "secret" || n === "longhex");
        return hit.length ? `looks like a secret (${hit.join(", ")}) — keep it .local` : null;
      },
    },
    {
      id: "pub:no-pii",
      scope: "public",
      statement: "Fragments carrying PII are rejected; distill a de-identified version instead.",
      test: (t) => {
        const hit = findSensitive(t).filter((n) => n === "email" || n === "phone");
        return hit.length ? `contains PII (${hit.join(", ")})` : null;
      },
    },
    {
      id: "pub:reasoning-signal",
      scope: "public",
      statement: "A fragment should carry a reasoning signal, not be pure filler/announcement.",
      test: (t) => {
        const cue =
          /\b(because|so that|in order to|step|compare|contrast|must|should|avoid|if|when|unless|prefer|first|then|ensure|only|identify|distinguish|separate|consider|define|explain|treat|focus|before|after|instead|rather)\b/i;
        const ok = cue.test(t) || contentWords(t).length >= 4;
        return ok ? null : "no reasoning signal to distill (filler)";
      },
    },
    {
      id: "priv:no-placeholder",
      scope: "private",
      statement: "Local rule: skip placeholders and scaffolding.",
      test: (t) => (/\b(todo|tbd|fixme|placeholder|lorem ipsum)\b/i.test(t) ? "placeholder text" : null),
    },
  ];
}

export function defaultGoal(): GoalProfile {
  return {
    id: "default",
    objective:
      "Improve human–AI collaboration: stronger reasoning, alignment, interdisciplinary thinking, safer outputs.",
    keywords: [
      "reasoning",
      "alignment",
      "safety",
      "interdisciplinary",
      "constraint",
      "compare",
      "step",
      "because",
      "structure",
      "evidence",
      "verify",
      "modular",
      "architecture",
      "assumption",
      "distill",
    ],
    keepThreshold: 0.45,
  };
}

// Customizable overrides (data only, stays .local):
//   .local/assumptions.json -> { "disabled": ["pub:reasoning-signal"], "reject": [{ "id": "...", "statement": "...", "contains": "regex" }] }
//   .local/goal.json        -> { "objective": "...", "keywords": [...], "keepThreshold": 0.5 }
export function loadAssumptions(dataDir: string): Assumption[] {
  const base = defaultAssumptions();
  const file = join(dataDir, "assumptions.json");
  if (!existsSync(file)) return base;
  try {
    const cfg = JSON.parse(readFileSync(file, "utf8")) as {
      disabled?: string[];
      reject?: Array<{ id: string; statement: string; contains: string }>;
    };
    const disabled = new Set(cfg.disabled ?? []);
    const kept = base.filter((a) => !disabled.has(a.id));
    for (const r of cfg.reject ?? []) {
      const re = new RegExp(r.contains, "i");
      kept.push({
        id: r.id,
        scope: "private",
        statement: r.statement,
        test: (t) => (re.test(t) ? `matched custom rule ${r.id}` : null),
      });
    }
    return kept;
  } catch {
    return base;
  }
}

export function loadGoal(dataDir: string): GoalProfile {
  const goal = defaultGoal();
  const file = join(dataDir, "goal.json");
  if (!existsSync(file)) return goal;
  try {
    const cfg = JSON.parse(readFileSync(file, "utf8")) as Partial<GoalProfile>;
    return {
      ...goal,
      ...cfg,
      keywords: cfg.keywords ?? goal.keywords,
    };
  } catch {
    return goal;
  }
}

// Run the gate: first failing assumption wins; otherwise pass.
export function gate(text: string, assumptions: Assumption[]): GateVerdict {
  for (const a of assumptions) {
    const reason = a.test(text);
    if (reason) {
      return { pass: false, failedAssumption: a.id, reason: `${a.id}: ${reason}` };
    }
  }
  return { pass: true, failedAssumption: null, reason: "passed all assumptions" };
}
