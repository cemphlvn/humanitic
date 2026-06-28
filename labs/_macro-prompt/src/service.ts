#!/usr/bin/env node
// Macro-Prompt Lab — local HTTP service. ONE truth source: the real engine + the real
// .local store. The web UI is a thin client over this. Binds 127.0.0.1; nothing leaves
// the machine except an opt-in, de-identified contribution you approve.

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { selectEngine, engineStatus } from "./adapters/inference/index.ts";
import { Library } from "./library/index.ts";
import { Ontology } from "./ontology/graph.ts";
import { loadGoal } from "./assumptions/index.ts";
import { loadFilters, saveFilters, effectiveAssumptions, genaiFilter, type FilterConfig } from "./filters/index.ts";
import { extract, commit, type ApprovedSnippet } from "./core/review.ts";
import { Macros, type MacroItem } from "./macros/index.ts";
import { compose, guard, publish } from "./share/index.ts";
import { discoverLocalModels } from "./models/local.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEB_DIR = join(ROOT, "app", "web");
const DATA_DIR = process.env.MPL_DATA_DIR || join(ROOT, ".local");
const COMMONS_DIR = process.env.MPL_COMMONS_DIR || join(ROOT, "commons");
const PORT = Number(process.env.MPL_PORT || 4505);
const HOST = "127.0.0.1";

const TYPES: Record<string, string> = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml",
};

function body(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => { try { resolve(b ? JSON.parse(b) : {}); } catch { resolve({}); } });
  });
}
function json(res: ServerResponse, code: number, data: unknown): void {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// fresh ontology over a clone of the library — never mutate the library array during a read
const freshOntology = (lib: Library) => new Ontology(lib.all().map((s) => ({ ...s })));

async function api(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const p = url.pathname;
  const m = req.method || "GET";
  const lib = new Library(DATA_DIR);

  // --- status ---
  if (p === "/api/status" && m === "GET") {
    const status = await engineStatus(url.searchParams.get("engine") || undefined);
    const filters = loadFilters(DATA_DIR);
    return json(res, 200, { engine: status, filters, library: lib.all().length, goal: loadGoal(DATA_DIR) });
  }

  // --- extract (run, no save) ---
  if (p === "/api/extract" && m === "POST") {
    const b = await body(req);
    const inference = await selectEngine(b.engine);
    const filters = loadFilters(DATA_DIR);
    const result = await extract({
      text: String(b.text || ""),
      spans: Array.isArray(b.spans) ? b.spans : undefined,
      inference,
      ontology: freshOntology(lib),
      assumptions: effectiveAssumptions(filters),
      goal: loadGoal(DATA_DIR),
      genaiFilter: genaiFilter(filters, inference),
      bypassGate: !!b.bypassGate,
    });
    return json(res, 200, result);
  }

  // --- learn (save approved set) ---
  if (p === "/api/learn" && m === "POST") {
    const b = await body(req);
    const approved: ApprovedSnippet[] = Array.isArray(b.snippets) ? b.snippets : [];
    const saved = commit(approved, lib, freshOntology(lib));
    return json(res, 200, { saved: saved.length, snippets: saved });
  }

  // --- library ---
  if (p === "/api/library" && m === "GET") return json(res, 200, { snippets: lib.all() });
  if (p.startsWith("/api/library/") && p.endsWith("/neighbors") && m === "GET") {
    const id = p.slice("/api/library/".length, -"/neighbors".length);
    const center = lib.get(id);
    if (!center) return json(res, 404, { error: "not found" });
    const neighbors = center.placement.neighbors
      .map((n) => { const s = lib.get(n.id); return s ? { snippet: { id: s.id, kind: s.kind, gloss: s.gloss, move: s.move }, score: n.score } : null; })
      .filter(Boolean);
    return json(res, 200, { center: { id: center.id, kind: center.kind, gloss: center.gloss, move: center.move }, relation: center.placement.relation, neighbors });
  }
  if (p.startsWith("/api/library/") && m === "DELETE") {
    const id = p.slice("/api/library/".length);
    return json(res, 200, { removed: lib.remove(id) });
  }

  // --- filters ---
  if (p === "/api/filters" && m === "GET") return json(res, 200, loadFilters(DATA_DIR));
  if (p === "/api/filters" && m === "PUT") {
    const b = (await body(req)) as FilterConfig;
    saveFilters(DATA_DIR, b);
    return json(res, 200, loadFilters(DATA_DIR));
  }

  // --- macros ---
  if (p === "/api/macros" && m === "GET") return json(res, 200, { macros: new Macros(DATA_DIR).all() });
  if (p === "/api/macros" && m === "POST") {
    const b = await body(req);
    const items: MacroItem[] = Array.isArray(b.items) ? b.items : [];
    const macro = new Macros(DATA_DIR).save(String(b.name || "untitled"), items);
    return json(res, 200, { macro });
  }
  if (p.startsWith("/api/macros/") && m === "DELETE") {
    new Macros(DATA_DIR).remove(p.slice("/api/macros/".length));
    return json(res, 200, { ok: true });
  }

  // --- contribute (opt-in, de-identified) ---
  if (p === "/api/contribute/preview" && m === "POST") {
    const b = await body(req);
    const stored = lib.get(String(b.id));
    if (!stored) return json(res, 404, { error: "not found" });
    const share = await compose(stored, await selectEngine(b.engine));
    const check = guard(share);
    return json(res, 200, { share, ok: check.ok, reason: check.reason });
  }
  if (p === "/api/contribute" && m === "POST") {
    const b = await body(req);
    const stored = lib.get(String(b.id));
    if (!stored) return json(res, 404, { error: "not found" });
    const share = await compose(stored, await selectEngine(b.engine));
    const check = guard(share);
    if (!check.ok) return json(res, 400, { error: "blocked", reason: check.reason });
    publish(share, COMMONS_DIR);
    lib.setShare(stored.id, true);
    return json(res, 200, { shareId: share.id, abstract: share.abstract, tags: share.tags });
  }

  // --- local model discovery ---
  if (p === "/api/models" && m === "GET") return json(res, 200, { models: discoverLocalModels() });

  json(res, 404, { error: "unknown endpoint" });
}

async function serveStatic(res: ServerResponse, pathname: string): Promise<void> {
  let rel = decodeURIComponent(pathname);
  if (rel === "/") rel = "/index.html";
  const file = join(WEB_DIR, rel.replace(/\.\.+/g, ""));
  if (!file.startsWith(WEB_DIR)) { res.writeHead(403).end("forbidden"); return; }
  try {
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);
  try {
    if (url.pathname.startsWith("/api/")) await api(req, res, url);
    else await serveStatic(res, url.pathname);
  } catch (err) {
    json(res, 500, { error: String((err as Error)?.message || err) });
  }
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`\n  Macro-Prompt Lab → http://${HOST}:${PORT}\n  (local-first; one .local store; Ctrl+C to stop)\n\n`);
});
