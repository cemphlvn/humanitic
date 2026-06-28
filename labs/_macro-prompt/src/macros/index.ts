// Macro-prompts — named, reusable compositions of snippets (+ free text).
// Reason to change: how reusable prompts are assembled and stored. .local/macros.json.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { nowISO, shortHash } from "../core/util.ts";

export type MacroItem = { type: "snippet"; id: string } | { type: "text"; text: string };

export interface Macro {
  id: string;
  name: string;
  items: MacroItem[];
  createdAt: string;
  updatedAt: string;
}

export class Macros {
  private file: string;
  private items: Macro[] = [];

  constructor(dataDir: string) {
    mkdirSync(dataDir, { recursive: true });
    this.file = join(dataDir, "macros.json");
    if (existsSync(this.file)) {
      try { this.items = JSON.parse(readFileSync(this.file, "utf8")) as Macro[]; } catch { this.items = []; }
    }
  }

  all(): Macro[] { return this.items; }
  get(id: string): Macro | undefined { return this.items.find((m) => m.id === id); }

  save(name: string, items: MacroItem[]): Macro {
    const macro: Macro = { id: "m-" + shortHash(name + nowISO()), name, items, createdAt: nowISO(), updatedAt: nowISO() };
    this.items.push(macro);
    this.persist();
    return macro;
  }

  remove(id: string): void {
    this.items = this.items.filter((m) => m.id !== id);
    this.persist();
  }

  private persist(): void { writeFileSync(this.file, JSON.stringify(this.items, null, 2)); }
}
