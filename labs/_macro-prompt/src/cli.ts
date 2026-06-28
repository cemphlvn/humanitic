#!/usr/bin/env node
// Macro-Prompt Lab CLI — the one input place. A thin driver over the loop orchestrator
// (core/loop.ts). The setup helps one easily /learn, /experiment, /contribute.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { selectEngine } from "./adapters/inference/index.ts";
import { loadAssumptions, loadGoal } from "./assumptions/index.ts";
import { Remembrance } from "./core/remembrance.ts";
import { runLoop, type LoopReport } from "./core/loop.ts";
import { Library } from "./library/index.ts";
import { Ontology } from "./ontology/graph.ts";
import { adapterFor } from "./snippets/index.ts";
import { compose, guard, publish } from "./share/index.ts";
import { discoverLocalModels, mlxRuntimeStatus } from "./models/local.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = process.env.MPL_DATA_DIR || join(ROOT, ".local");
// commons/ is intentionally NOT gitignored — only de-identified, opt-in shares live there.
const COMMONS_DIR = process.env.MPL_COMMONS_DIR || join(ROOT, "commons");

interface Args {
  command: string;
  engine?: string;
  file?: string;
  text?: string;
  id?: string;
  share: boolean;
  all: boolean;
  json: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { command: argv[0] || "help", share: false, all: false, json: false, help: false };
  const positional: string[] = [];
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--engine") args.engine = argv[++i];
    else if (a === "--file") args.file = argv[++i];
    else if (a === "--text") args.text = argv[++i];
    else if (a === "--id") args.id = argv[++i];
    else if (a === "--share") args.share = true;
    else if (a === "--all") args.all = true;
    else if (a === "--json") args.json = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else positional.push(a);
  }
  if (!args.text && positional.length) args.text = positional.join(" ");
  if (!args.id && positional.length && args.command === "contribute") args.id = positional[0];
  return args;
}

function usage(): string {
  return `Humanitic Macro-Prompt Lab — the lens that distills macro-prompts into nano-snippets.

Usage:
  mpl demo
  mpl learn "<paste a macro-prompt>"      (or --file prompt.txt, or pipe via stdin)
  mpl experiment "<...>"                   dry-run — distill without saving
  mpl contribute <snippet-id>              opt-in: anonymize + abstract into the commons (--all for every snippet)
  mpl library | assumptions | goal | models inspect the private/local state

Commands:
  learn        Run the loop and commit kept snippets to the private library.
  experiment   Run the loop without committing (for tinkering).
  contribute   Publish de-identified shares (opt-in, per-snippet).
  demo         Run learn on a built-in sample.
  library      List the private library.
  assumptions  List the active gate assumptions (the gate is auditable).
  goal         Show the research-goal profile.
  models       Scan common local model stores (MLX/Hugging Face, Ollama, LM Studio).

Options:
  --engine heuristic|mlx|claude   Default: heuristic. MLX and Claude are opt-in and fall back offline.
  --share                     Mark newly kept snippets as opt-in for later contribution.
  --json                      Machine-readable output.

The raw prompt and the private library stay in .local/ and never leave (Article 0).
`;
}

function readStdin(): string {
  try {
    if (process.stdin.isTTY) return "";
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function inputText(args: Args): string {
  if (args.text) return args.text;
  if (args.file) return readFileSync(args.file, "utf8");
  return readStdin();
}

const SAMPLE = [
  "Before answering, identify the hidden assumption in the user's framing.",
  "Compare multiple possible interpretations before choosing the most useful one.",
  "Prefer grounded mechanisms over vague explanations so that the output can be tested.",
  "Only modularize things that have different reasons to change.",
  "Separate user intent, hidden assumptions, and risk when the topic touches safety or alignment.",
  "API_KEY=sk-secret-please-do-not-distill-this-0123456789abcdef",
].join("\n");

function printReport(report: LoopReport, args: Args, save: boolean): void {
  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }
  const out: string[] = [];
  out.push(
    `engine: ${report.engine}   fragments: ${report.fragmentCount}   ` +
      `kept: ${report.kept.length}   dropped: ${report.dropped.length}   rejected: ${report.rejected.length}` +
      (save ? "" : "   (dry-run — nothing saved)"),
  );
  if (report.kept.length) {
    out.push("\n\x1b[1mKEPT\x1b[0m");
    for (const k of report.kept) {
      out.push(
        `  ${adapterFor(k.snippet.kind).render(k.snippet)}\n` +
          `      ↳ ${k.placement.relation} (nearest ${k.placement.nearestScore}) · score ${k.score.score} · ${k.snippet.id}`,
      );
    }
  }
  if (report.dropped.length) {
    out.push("\n\x1b[1mDROPPED (a result, not a defeat)\x1b[0m");
    for (const d of report.dropped) out.push(`  ✕ [${d.snippet.kind}] ${d.snippet.gloss}\n      ↳ ${d.score.why}`);
  }
  if (report.rejected.length) {
    out.push("\n\x1b[1mREJECTED AT THE GATE\x1b[0m");
    for (const r of report.rejected) {
      const snip = r.fragment.length > 70 ? r.fragment.slice(0, 70) + "…" : r.fragment;
      out.push(`  ⛔ ${r.verdict.failedAssumption} — ${r.verdict.reason}\n      “${snip}”`);
    }
  }
  process.stdout.write(out.join("\n") + "\n");
}

async function distill(args: Args, save: boolean): Promise<void> {
  const text = args.command === "demo" ? SAMPLE : inputText(args);
  if (!text.trim()) {
    process.stderr.write("No input. Pass text, --file <path>, or pipe via stdin. (Try: mpl demo)\n");
    process.exitCode = 1;
    return;
  }
  const inference = await selectEngine(args.engine);
  const library = new Library(DATA_DIR);
  const ontology = new Ontology(library.all().map((s) => ({ ...s }))); // clone — never mutate the library array
  const report = await runLoop({
    text,
    inference,
    library,
    ontology,
    assumptions: loadAssumptions(DATA_DIR),
    goal: loadGoal(DATA_DIR),
    save,
    remembrance: new Remembrance(DATA_DIR),
    optInShare: args.share,
  });
  printReport(report, args, save);
  if (save && report.kept.length && !args.json) {
    process.stdout.write(`\nKept privately. Contribute a de-identified version with:  mpl contribute <snippet-id>\n`);
  }
}

async function contribute(args: Args): Promise<void> {
  const library = new Library(DATA_DIR);
  const all = library.all();
  if (!all.length) {
    process.stdout.write('Library is empty. Run `mpl learn "<prompt>"` (or `mpl demo`) first.\n');
    return;
  }
  const targets = args.all ? all : args.id ? all.filter((s) => s.id === args.id) : [];
  if (!targets.length) {
    process.stdout.write("Shareable candidates (contributing is opt-in, per-snippet):\n");
    for (const s of all) {
      process.stdout.write(`  ${s.optInShare ? "✔" : "·"} ${s.id}  [${s.kind}/${s.placement.relation}]  ${s.gloss}\n`);
    }
    process.stdout.write("\nPublish with:  mpl contribute <snippet-id>   (or --all)\n");
    return;
  }
  const inference = await selectEngine(args.engine);
  const remembrance = new Remembrance(DATA_DIR);
  const shared = [];
  for (const stored of targets) {
    const share = await compose(stored, inference);
    const check = guard(share);
    if (!check.ok) {
      process.stdout.write(`⛔ ${stored.id} not published — ${check.reason}\n`);
      continue;
    }
    publish(share, COMMONS_DIR);
    library.setShare(stored.id, true);
    remembrance.log("shared", `contributed ${stored.id} as ${share.id}`, { abstract: share.abstract });
    shared.push(share);
    process.stdout.write(`✔ ${share.id}  [HUMANITIK]  “${share.abstract}”  tags: ${share.tags.join(", ")}\n`);
  }
  if (args.json) process.stdout.write(`${JSON.stringify(shared, null, 2)}\n`);
  else if (shared.length) process.stdout.write(`\nCommons: ${join(COMMONS_DIR, "commons.jsonl")}\n`);
}

function showLibrary(): void {
  const all = new Library(DATA_DIR).all();
  if (!all.length) return void process.stdout.write("Library is empty. Run `mpl demo` to seed it.\n");
  process.stdout.write(`${all.length} snippet(s) in the private library:\n`);
  for (const s of all) {
    process.stdout.write(
      `  ${s.optInShare ? "✔shared" : "       "} [${s.kind}/${s.placement.relation}] score ${s.score.score}  ${s.gloss}  (${s.id})\n`,
    );
  }
}

function showAssumptions(): void {
  const list = loadAssumptions(DATA_DIR);
  process.stdout.write(`${list.length} active assumption(s) — the gate is explicit and auditable:\n`);
  for (const a of list) process.stdout.write(`  [${a.scope}] ${a.id}\n      ${a.statement}\n`);
}

function showGoal(): void {
  const g = loadGoal(DATA_DIR);
  process.stdout.write(`goal: ${g.id}\n  objective: ${g.objective}\n  keepThreshold: ${g.keepThreshold}\n  keywords: ${g.keywords.join(", ")}\n`);
}

function showModels(args: Args): void {
  const models = discoverLocalModels();
  const mlxRuntime = mlxRuntimeStatus();
  if (args.json) {
    process.stdout.write(`${JSON.stringify({ mlxRuntime, models }, null, 2)}\n`);
    return;
  }
  process.stdout.write(
    `MLX runtime: ${mlxRuntime.usable ? "usable" : mlxRuntime.commandFound ? "found but not usable" : "not found"}\n`,
  );
  if (mlxRuntime.command) process.stdout.write(`  command: ${mlxRuntime.command}\n`);
  if (mlxRuntime.error) process.stdout.write(`  note: ${mlxRuntime.error}\n`);
  if (!models.length) {
    process.stdout.write("No local models found in Hugging Face, Ollama, or LM Studio default stores.\n");
    return;
  }
  process.stdout.write(`${models.length} local model candidate(s):\n`);
  for (const m of models) {
    process.stdout.write(`  [${m.provider}] ${m.name}\n      ${m.path}\n      ${m.note}\n`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return void process.stdout.write(usage());
  switch (args.command) {
    case "learn":
    case "demo":
      return distill(args, true);
    case "experiment":
      return distill(args, false);
    case "contribute":
      return contribute(args);
    case "library":
      return showLibrary();
    case "assumptions":
      return showAssumptions();
    case "goal":
      return showGoal();
    case "models":
      return showModels(args);
    case "help":
    default:
      return void process.stdout.write(usage());
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exitCode = 1;
});
