// Prompt Intake Layer — OBSERVE.
// One job: turn a pasted macro-prompt into clean, segmented fragments.
// It earns a seam only as a clear boundary; the logic itself is small.

import type { Fragment } from "./types.ts";

const MAX_FRAGMENT_CHARS = 600;

function clean(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Split a long paragraph into sentence-ish chunks so no fragment is unwieldy.
function segment(paragraph: string): string[] {
  if (paragraph.length <= MAX_FRAGMENT_CHARS) return [paragraph];
  const sentences = paragraph
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if ((buf + " " + s).trim().length > MAX_FRAGMENT_CHARS && buf) {
      out.push(buf.trim());
      buf = s;
    } else {
      buf = (buf + " " + s).trim();
    }
  }
  if (buf) out.push(buf.trim());
  return out;
}

export function intake(input: string): Fragment[] {
  const cleaned = clean(input);
  if (!cleaned) return [];
  // Macro-prompts are line-oriented: each line (single or blank-separated) is a unit.
  // Long lines are further sentence-segmented so no fragment is unwieldy.
  const lines = cleaned
    .split(/\n+/)
    .map((l) => l.replace(/^[-*•]\s+/, "").trim())
    .filter(Boolean);
  const fragments: Fragment[] = [];
  let index = 0;
  for (const line of lines) {
    for (const seg of segment(line)) {
      if (!seg.trim()) continue;
      fragments.push({ id: `f${index}`, index, text: seg.trim() });
      index++;
    }
  }
  return fragments;
}
