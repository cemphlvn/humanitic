# Codex Guide For This Node

This repo is the app-side working node for Macro-Prompt Lab. Treat it as a local-first research app core, not a generic prompt manager.

## Invariants

- Raw pasted prompts stay local under `.local/`.
- Public contribution is opt-in, de-identified, and goes through `src/share/index.ts`.
- A rejected fragment is a result; log the failed assumption instead of silently dropping it.
- Concept-snippets and intent-snippets are separate adapter kinds. Do not merge their models or UI treatment.
- Inference engines are swappable through `src/adapters/inference/index.ts`.

## Commands

```bash
npm run demo
npm run learn -- --file prompt.txt
npm run experiment -- --text "Before answering, identify hidden assumptions."
npm run contribute -- --id <snippet-id>
npm run typecheck
```

Default engine is `heuristic`, which is offline and deterministic. Use `--engine claude` only when the user explicitly wants remote inference and has configured `ANTHROPIC_API_KEY`.

## Architecture Rule

Add a module only when it has a different reason to change. The app currently has these earned boundaries:

- `core`: intake, types, remembrance, shared utilities.
- `assumptions`: public/private admission gate and research goal profile.
- `snippets`: concept and intent snippet adapters.
- `adapters/inference`: heuristic default, MLX local through `mlx-lm`, Claude optional.
- `ontology`: FHRR/VSA vector floor and graph positioning.
- `evaluator`: research-goal scoring.
- `library`: private local snippet persistence.
- `share`: opt-in knowledge-share composer and publish guard.

## App Direction

The Mac app should open directly into the working lab:

- one paste editor,
- optional local highlights,
- separate concept and intent panes,
- ontology placement and rejected results,
- `/learn`, `/experiment`, `/contribute` actions.

Keep the first implementation boring and inspectable. MLX LLM, custom kernels, and richer ontology edges should fit behind the existing adapter contracts. Use `MPL_MLX_MODEL=<model> --engine mlx` when exercising the local MLX path.
