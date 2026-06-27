// Small shared utilities. No dependencies — safe to import anywhere.

// FNV-1a 32-bit hash → deterministic, fast, good enough for seeding vectors and ids.
export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shortHash(s: string): string {
  return hashString(s).toString(36);
}

// Date is fine in ordinary app code (only forbidden inside workflow scripts).
export function nowISO(): string {
  return new Date().toISOString();
}

export function clamp(x: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, x));
}

const STOPWORDS = new Set(
  ("a an the of to in on for and or but with without is are be been being this that these those " +
    "it its as at by from into over under again further then once here there all any both each few more " +
    "most other some such no nor not only own same so than too very can will just should now you your i we " +
    "they he she them his her our their what which who whom do does did doing have has had if else while " +
    "about above below up down out off about i'll it's i'm")
    .split(/\s+/),
);

export function isStopword(w: string): boolean {
  return STOPWORDS.has(w);
}

export function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\-\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function contentWords(text: string): string[] {
  return words(text).filter((w) => w.length > 2 && !isStopword(w));
}
