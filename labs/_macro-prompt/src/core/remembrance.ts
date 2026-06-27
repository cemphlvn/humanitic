// Remembrance — the refutation ethos made concrete.
// A rejected fragment or dropped snippet is a *result*, not a defeat. We log it
// so the gate and the goal profile can be refined, and so a fresh session inherits
// what this one learned. Lives in .local (never leaves).

import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { nowISO } from "./util.ts";

export type RemembranceKind = "rejected" | "dropped" | "kept" | "shared";

export interface RemembranceEntry {
  at: string;
  kind: RemembranceKind;
  truth: string;
  detail?: Record<string, unknown>;
}

export class Remembrance {
  private file: string;
  constructor(dataDir: string) {
    mkdirSync(dataDir, { recursive: true });
    this.file = join(dataDir, "remembrance.jsonl");
  }
  log(kind: RemembranceKind, truth: string, detail?: Record<string, unknown>): void {
    const entry: RemembranceEntry = { at: nowISO(), kind, truth, detail };
    appendFileSync(this.file, JSON.stringify(entry) + "\n");
  }
}
