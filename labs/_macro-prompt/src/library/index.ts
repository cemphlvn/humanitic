// Private Snippet Library — COMMIT. User-owned memory, local-first.
//
// Reason to change: storage. Article 0: this lives under .local/ and never leaves.
// The library is also the ontology's persistence — the graph is loaded from here on
// boot, so it grows across sessions.

import type { StoredSnippet } from "../core/types.ts";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export class Library {
  private file: string;
  private items: StoredSnippet[] = [];

  constructor(dataDir: string) {
    mkdirSync(dataDir, { recursive: true });
    this.file = join(dataDir, "library.json");
    if (existsSync(this.file)) {
      try {
        this.items = JSON.parse(readFileSync(this.file, "utf8")) as StoredSnippet[];
      } catch {
        this.items = [];
      }
    }
  }

  all(): StoredSnippet[] {
    return this.items;
  }

  get(id: string): StoredSnippet | undefined {
    return this.items.find((s) => s.id === id);
  }

  has(id: string): boolean {
    return this.items.some((s) => s.id === id);
  }

  remove(id: string): boolean {
    const before = this.items.length;
    this.items = this.items.filter((s) => s.id !== id);
    if (this.items.length === before) return false;
    this.persist();
    return true;
  }

  // Upsert by id (re-distilling the same gloss updates placement/score).
  save(s: StoredSnippet): void {
    const i = this.items.findIndex((x) => x.id === s.id);
    if (i >= 0) this.items[i] = s;
    else this.items.push(s);
    this.persist();
  }

  setShare(id: string, optIn: boolean): boolean {
    const s = this.get(id);
    if (!s) return false;
    s.optInShare = optIn;
    this.persist();
    return true;
  }

  private persist(): void {
    writeFileSync(this.file, JSON.stringify(this.items, null, 2));
  }
}
