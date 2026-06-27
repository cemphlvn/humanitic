# Plan — Macro-Prompt Lab

> One Mac app, one local inference engine. Modular **only** where a part has its own
> reason to change. Working end-to-end offline; Claude (or any engine) drops in behind
> one seam.

---

## What this node is for (the job, from the brief)

Distill macro-prompts into a private library of **nano-snippets** — tiny nuance carriers —
gated by explicit assumptions, positioned in an ontology graph, kept locally, and
optionally contributed (anonymized, opt-in) to a public research commons. The setup
helps one easily **/learn**, **/experiment**, **/contribute**.

Two snippet kinds, deliberately separated and modulated (the adapter approach, like SDK
plugins — important for a clean mind in the MacBook UI and for maintainability by agentic
researchers):

- **concept-snippets** — 2-3 word reusable ideas.
- **intent-snippets** — dense sentences that each carry one reasoning move.

---

## The semantic-limit test — what earns its own module

The rule from the brief: *do not make every function a module; modularize only things
that have different **reasons to change**.* Each module below is named by its reason to
change. Anything that doesn't pass the test stays a plain file inside `core/`.

| Module | Path | Reason to change (why it's a module) |
|--------|------|--------------------------------------|
| **Inference adapter** | `src/adapters/inference/` | Which ENGINE runs. Today a heuristic (offline) and Claude (structured outputs); tomorrow a local MLX/SLM. The swap point. |
| **Snippet adapters** | `src/snippets/` | A snippet KIND's shape/extraction. `concept` and `intent` are different things → one module each behind a shared contract. New kinds register here. |
| **Assumptions (gate)** | `src/assumptions/` | Research philosophy + safety policy. Explicit and auditable; a rejection names the assumption. |
| **Ontology (kernel + graph)** | `src/ontology/` | The knowledge structure and the vector ops (`vector.ts` is the readable FHRR/VSA floor where real MLX kernels land later). |
| **Evaluator** | `src/evaluator/` | The research-goal profile and how "does this improve the goal?" is scored. |
| **Library** | `src/library/` | Storage. Article 0: local-first, never leaves. Also the ontology's persistence. |
| **Share composer + commons** | `src/share/` | Privacy/governance. The publish gate: opt-in, de-identified, guarded. |
| **Loop orchestrator** | `src/core/loop.ts` | The order of the steps. Owns no domain rules — so each module's reason-to-change stays isolated. |

**Did NOT earn a module** (plain files in `core/`, by the same test):

- `core/intake.ts` — clean/split/segment. Small; one boundary, no independent evolution.
- `core/util.ts` — hashing, tokenizing, clamp. Pure helpers.
- `core/patterns.ts` — secret/PII detectors. Shared by the gate and the share guard; data, not a subsystem.
- `core/remembrance.ts` — append-only result log. A thin sink.

If any of these grows its own reason to change (e.g. intake gains file/clipboard/history
sources), it graduates to a module then — not before.

---

## The two adapter seams (this is what "easily swappable" means)

1. **Engine seam — `InferenceAdapter`.** One method: `complete<T>({task, system, prompt,
   jsonSchema, fallback})`. The *calling module* supplies BOTH an LLM recipe
   (system/prompt/jsonSchema) and an offline recipe (`fallback`) in one call; the adapter
   decides which to honor. So no module ever branches on "offline or LLM" — the engine is
   genuinely swappable (heuristic ↔ Claude ↔ MLX) without touching method code.
   - `heuristic.ts` — offline, deterministic, zero deps (the default; the offline ethic).
   - `claude.ts` — Anthropic Messages API with structured outputs (`output_config.format`),
     `claude-opus-4-8`, lazily imported as an optional dependency; falls back on refusal/error.
     (The verbatim's "agents sdk" maps to this seam — drop in the Agent SDK's `query()` here.)

2. **Snippet-kind seam — `SnippetAdapter`.** `{kind, schema, prompt, heuristic, normalize,
   render}`. concept and intent are independent modules in one registry. Adding a kind =
   appending to the registry; the loop, UI, and storage don't change.

---

## End-to-end flow (implemented, verified offline)

```
paste → intake → GATE(assumptions) ─reject→ remembrance(result)
                      │pass
                      ▼
                 DISTILL (concept + intent adapters, via the engine)
                      ▼
                 POSITION (ontology kernel: embed → nearest → novel/similar/contradictory/redundant/valuable)
                      ▼
                 EVALUATE (goal profile: keep? score?)
                      │keep                         │drop
                      ▼                             ▼
                 COMMIT (library + grow ontology)   remembrance(result)
                      ┄opt-in┄► SHARE (anonymize + guard) ► commons
```

The kept→ontology edge is the loop's spine: the graph grows, so the next pass is judged
against richer context (see [LOOP.md](./LOOP.md)).

---

## Run it (offline, this Mac, zero install — Node ≥ 23 native TypeScript)

```bash
node src/cli.ts demo                       # learn on a built-in sample
node src/cli.ts learn "<paste a prompt>"   # or --file prompt.txt, or pipe via stdin
node src/cli.ts experiment "<...>"         # dry-run — distill without saving
node src/cli.ts library                    # inspect the private library
node src/cli.ts contribute <snippet-id>    # opt-in: anonymize + publish to commons
node src/cli.ts assumptions | goal         # inspect the gate / research goal
```

Claude engine (opt-in): `ANTHROPIC_API_KEY=… node src/cli.ts learn "…" --engine claude`.
Optional deps + typecheck: `pnpm install && pnpm typecheck`.

---

## Status

- ✅ MVP end-to-end, offline by construction (heuristic engine).
- ✅ Concept + intent snippet kinds, separated behind the adapter contract.
- ✅ Assumption-gated; ontology positioning across sessions; goal evaluation.
- ✅ Article 0: `.local/` gitignored; only opt-in, de-identified shares reach `commons/`.
- ◻ Claude engine path built; exercise with a real key.

---

## Next phase — the AI app studio

The brief's next phase: an **AI app studio one can build for themselves** — start from this
node's two seams. New engines plug into the inference adapter; new distillation lenses plug
in as snippet kinds; the assumptions, goal profile, and commons stay customizable per
researcher. The `/learn · /experiment · /contribute` loop is the studio's inner cycle.
