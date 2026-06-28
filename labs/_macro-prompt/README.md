# Macro-Prompt Lab

A small, local-first desktop app for turning what you write into **reusable nano-snippets**,
with a real **judgment loop**: paste → (optionally mark spans) → run → review each result →
keep / reject / edit → **learn only the approved set** → compose **macro-prompts** → optionally
contribute a de-identified pattern.

One screen, one truth source. The web UI is a thin client over the **real engine** (`src/`)
and the **real `.local` store** — no second product core, no false persistence.

## Run it (needs Node ≥ 23)

```bash
cd labs/_macro-prompt
npm start                 # → http://127.0.0.1:4505
```

Everything is local: your library, macro-prompts, and filter rules live in `.local/` on this
machine. The only outbound call is an opt-in contribution you approve.

## The loop

- **Paste / Mark** — write or paste text; switch to *Mark spans* to highlight passages by
  category (important / assumption / reusable-move / risky-private / unclear) and run on just
  those. (Highlights use the native CSS Custom Highlight API — no DOM mutation.)
- **Run** — extract reviewable **concept** (2–3 word) and **intent** (reasoning-move) candidates.
  Nothing is saved yet.
- **Review** — each card shows kind · gloss · move · score (with *why*) · ontology placement ·
  source. Per item: **keep · reject · edit gloss · switch concept↔intent · inspect source ·
  explain score**. Click a placement for the **ontology mini-map** (neighbors + compare).
- **Learn** — commits *only* the snippets you kept to the library.
- **Set aside** — rejected fragments grouped by the exact gate that stopped them, with
  **override & keep** and **make rule**.
- **Macros** — drag snippets into a composing tray, save a reusable macro-prompt, copy it.
- **⌘K** — command bar.

## Filtering — you decide what gets through

Two parts (Lab → Filters):
- **Humanitik filtering** — shared public assumptions (secrets / PII / substance-free filler).
  **Opt out anytime.**
- **Your own** — write regex rules, and/or a **GenAI filter** (a local model judges each
  fragment against your instruction).

## Engines (honest status, top bar)

- **heuristic** — offline, deterministic (default).
- **server** — warm local model via an OpenAI-compatible endpoint (`mlx_lm.server`, Ollama,
  LM Studio). Set `MPL_SERVER_URL` (e.g. `http://127.0.0.1:8080/v1`).
- **mlx** — local `mlx_lm` CLI. **claude** — remote (needs `ANTHROPIC_API_KEY`).

The bar always shows the engine that actually ran and **why it fell back**, so a heuristic
result is never mistaken for a model result.

## What's where

```
app/web/      ← the app (npm start serves this): index.html + app.js + lib/* + vendor/*
src/          ← the engine + the local HTTP service (service.ts) the UI talks to
src/filters/  src/macros/  src/core/review.ts   ← the new modules behind the loop
archive/mac/  ← earlier native SwiftUI exploration, archived (needs Xcode; not maintained)
```

Net front-end dependency: **Preact + htm only**, vendored under `app/web/vendor/` (offline,
no build). The highlight tool, command bar, snippet cards, rejection explorer, engine status,
ontology mini-map, and design primitives are all custom (`app/web/lib/`).

```bash
pnpm install && pnpm typecheck   # optional: types for the engine + the @anthropic-ai/sdk
```

Part of the [Humanitic](../../) ecosystem — local-first, forever open.
