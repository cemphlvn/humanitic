# Humanitik Macro-Prompt Lab

Build a **private library of nano-snippets** — the tiny nuance carriers inside a great
prompt. Paste a macro-prompt; the lab distills it into **concept-snippets** (2-3 word
reusable ideas) and **intent-snippets** (dense sentences that carry one reasoning move),
gates them against explicit assumptions, positions them in an ontology graph, keeps what
helps locally, and lets you contribute de-identified patterns to a public research commons.

Local-first. Offline by construction. One app, one inference engine, two swappable seams.

---

## Quickstart (no install — needs Node ≥ 23)

```bash
cd labs/_macro-prompt

node src/cli.ts demo                          # see the whole loop on a built-in sample
node src/cli.ts learn "Before answering, identify the hidden assumption in the framing."
cat my-prompt.txt | node src/cli.ts learn     # or: --file my-prompt.txt
node src/cli.ts experiment "<...>"            # distill without saving (tinker mode)
node src/cli.ts library                       # what you've kept
node src/cli.ts contribute <snippet-id>       # opt-in: anonymize + publish to commons/
node src/cli.ts assumptions                   # the gate (explicit + auditable)
node src/cli.ts goal                          # the research-goal profile
```

The three verbs you'll live in: **/learn**, **/experiment**, **/contribute**.

---

## Engines (the swappable brain)

- **heuristic** (default) — offline, deterministic, zero dependencies.
- **claude** — opt-in, via the Anthropic SDK with structured outputs (`claude-opus-4-8`).
  Falls back to heuristic if unavailable.

```bash
ANTHROPIC_API_KEY=sk-... node src/cli.ts learn "<...>" --engine claude
pnpm install     # adds the optional @anthropic-ai/sdk + typecheck deps
pnpm typecheck
```

The engine lives behind one adapter (`src/adapters/inference/`), so swapping to a local
MLX/SLM later touches nothing else.

---

## Privacy (Article 0)

Your raw prompts and your private library live in `.local/` and are **git-ignored and
unpublishable**. Only de-identified, opt-in, per-snippet abstracts reach `commons/`, and a
guard re-checks every one before it leaves. See [MACRO-PROMPT.md](./MACRO-PROMPT.md).

---

## Learn more

[LOOP.md](./LOOP.md) (the running loop) · [PLAN.md](./PLAN.md) (architecture) ·
[INDEX.md](./INDEX.md) (map) · [_vector.yaml](./_vector.yaml) (the node's curiosity)

Part of the [Humanitic](../../) ecosystem — forever open, rewarded by contribution degree.
