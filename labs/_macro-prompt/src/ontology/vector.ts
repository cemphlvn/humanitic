// Kernel Layer — a readable VSA / FHRR-flavored floor.
//
// Reason to change: the vector representation and its ops (this is where real MLX
// custom kernels + FHRR phasor binding would land later). For now: deterministic,
// dependency-free, offline. Each token gets a fixed pseudo-random vector; a snippet
// is the normalized BUNDLE (superposition) of its token vectors. bind() is the
// FHRR-style composition op. cosine() measures position in the manifold.

import { contentWords, hashString } from "../core/util.ts";

export const DIM = 256;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const tokenCache = new Map<string, number[]>();

function tokenVector(token: string): number[] {
  const cached = tokenCache.get(token);
  if (cached) return cached;
  const rng = mulberry32(hashString(token));
  const v = new Array<number>(DIM);
  for (let i = 0; i < DIM; i++) v[i] = rng() * 2 - 1; // [-1, 1]
  tokenCache.set(token, v);
  return v;
}

export function normalize(v: number[]): number[] {
  let mag = 0;
  for (const x of v) mag += x * x;
  mag = Math.sqrt(mag) || 1;
  return v.map((x) => x / mag);
}

export function bundle(vectors: number[][]): number[] {
  const acc = new Array<number>(DIM).fill(0);
  for (const v of vectors) for (let i = 0; i < DIM; i++) acc[i] += v[i];
  return normalize(acc);
}

// FHRR-style binding: element-wise composition. Exposed for future relation encoding.
export function bind(a: number[], b: number[]): number[] {
  const out = new Array<number>(DIM);
  for (let i = 0; i < DIM; i++) out[i] = a[i] * b[i];
  return out;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < DIM; i++) dot += a[i] * b[i];
  return dot; // both inputs are unit vectors
}

export function tokensOf(text: string): string[] {
  return contentWords(text);
}

export function embed(text: string): number[] {
  const toks = tokensOf(text);
  if (toks.length === 0) return new Array<number>(DIM).fill(0);
  return bundle(toks.map(tokenVector));
}
