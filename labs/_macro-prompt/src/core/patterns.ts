// Shared detectors for secrets and PII. Used by the assumption gate (admission)
// and the share guard (publication) — the two ethical chokepoints.

export const PATTERNS: Record<string, RegExp> = {
  email: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  handle: /(^|\s)@[a-z0-9_]{3,}\b/i,
  phone: /(?:\+?\d[\s().-]?){9,}\d/,
  secret: /\b(sk-[a-z0-9]{8,}|AKIA[0-9A-Z]{12,}|ghp_[a-z0-9]{20,}|api[_-]?keys?|secret[_-]?keys?|bearer\s+[a-z0-9._-]{12,})\b/i,
  longhex: /\b[0-9a-f]{32,}\b/i,
};

export function findSensitive(text: string): string[] {
  return Object.entries(PATTERNS)
    .filter(([, re]) => re.test(text))
    .map(([name]) => name);
}

export function scrub(text: string): string {
  let out = text;
  out = out.replace(PATTERNS.email, "‹email›");
  out = out.replace(PATTERNS.secret, "‹secret›");
  out = out.replace(PATTERNS.longhex, "‹token›");
  out = out.replace(PATTERNS.phone, "‹number›");
  out = out.replace(/(^|\s)@[a-z0-9_]{3,}\b/gi, "$1‹handle›");
  return out;
}
