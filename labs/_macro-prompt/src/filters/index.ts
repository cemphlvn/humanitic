// Filters — you decide what gets through. Two parts, exactly as specified:
//   1) Humanitik filtering (the shared public assumption pack) — opt-out.
//   2) Your own filtering — written regex rules, and/or a genai filter (a model
//      judges each fragment against your instruction).
// Reason to change: filtering policy/UX. Persists to .local/filters.json.

import type { Assumption } from "../core/types.ts";
import type { InferenceAdapter } from "../adapters/inference/index.ts";
import { defaultAssumptions } from "../assumptions/index.ts";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface FilterRule {
  id: string;
  label: string;
  pattern: string; // case-insensitive regex; matching fragments are set aside
}

export interface FilterConfig {
  humanitik: boolean;
  rules: FilterRule[];
  genai: { enabled: boolean; instruction: string };
}

export function defaultFilterConfig(): FilterConfig {
  return { humanitik: true, rules: [], genai: { enabled: false, instruction: "" } };
}

export function loadFilters(dataDir: string): FilterConfig {
  const f = join(dataDir, "filters.json");
  if (!existsSync(f)) return defaultFilterConfig();
  try {
    const cfg = JSON.parse(readFileSync(f, "utf8")) as Partial<FilterConfig>;
    return {
      humanitik: cfg.humanitik ?? true,
      rules: Array.isArray(cfg.rules) ? cfg.rules : [],
      genai: { enabled: cfg.genai?.enabled ?? false, instruction: cfg.genai?.instruction ?? "" },
    };
  } catch {
    return defaultFilterConfig();
  }
}

export function saveFilters(dataDir: string, cfg: FilterConfig): void {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, "filters.json"), JSON.stringify(cfg, null, 2));
}

// The rule-based gate the loop runs: Humanitik pack (if on) + your custom rules.
export function effectiveAssumptions(cfg: FilterConfig): Assumption[] {
  const list: Assumption[] = cfg.humanitik ? defaultAssumptions() : [];
  for (const r of cfg.rules) {
    let re: RegExp | null = null;
    try { re = new RegExp(r.pattern, "i"); } catch { re = null; }
    const label = r.label || r.pattern;
    list.push({
      id: "rule:" + r.id,
      scope: "private",
      statement: "Your rule: " + label,
      test: (t) => (re && re.test(t) ? "your rule “" + label + "”" : null),
    });
  }
  return list;
}

// The optional genai filter — undefined unless enabled with an instruction.
// Uses the selected engine; the offline fallback passes everything (and says so).
export function genaiFilter(
  cfg: FilterConfig,
  inference: InferenceAdapter,
): ((text: string) => Promise<{ pass: boolean; reason: string }>) | undefined {
  if (!cfg.genai.enabled || !cfg.genai.instruction.trim()) return undefined;
  const instruction = cfg.genai.instruction.trim();
  return (text: string) =>
    inference.complete<{ pass: boolean; reason: string }>({
      task: "filter",
      system:
        "You decide whether a text fragment passes a user's filter.\nThe user's rule: " +
        instruction +
        '\nReply with ONLY a JSON object {"pass": boolean, "reason": string}.',
      prompt: text,
      jsonSchema: {
        type: "object", additionalProperties: false, required: ["pass", "reason"],
        properties: { pass: { type: "boolean" }, reason: { type: "string" } },
      },
      maxTokens: 200,
      fallback: () => ({ pass: true, reason: "no model — genai filter skipped" }),
    });
}
