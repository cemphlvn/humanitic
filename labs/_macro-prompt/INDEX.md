# Macro-Prompt Lab Index

> The lens — assumption-gated FHRR distillation of macro-prompts into an ontology of
> nano-snippets. Offline by construction; sovereign by `.local`.

---

## Files

| File | Purpose |
|------|---------|
| [MACRO-PROMPT.md](./MACRO-PROMPT.md) | Philosophy and the node's place in the graph |
| [_vector.yaml](./_vector.yaml) | The node's evolving curiosity |
| [LOOP.md](./LOOP.md) | The running loop (OBSERVE → … → COMMIT), gates, runner |
| [PLAN.md](./PLAN.md) | The plan + status — what earns a module (semantic-limit test) |
| [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md) | App-side architecture: MVP loop, module boundaries, Mac UI shape, build phases |
| [AGENTS.md](./AGENTS.md) | Node guide for agents/contributors (invariants + commands) |
| [README.md](./README.md) | Quickstart |
| [src/](./src) | The app — see the layer map below |
| [commons/](./commons) | Opt-in, de-identified shares (the only thing that leaves) |

### Source layout (one folder per reason-to-change)

```
src/
  cli.ts                      one input place: learn · experiment · contribute · library · assumptions · goal
  core/        types · util · patterns · intake · remembrance · loop   (the orchestrator + plain helpers)
  adapters/inference/         index · heuristic · claude               (ENGINE seam — swappable)
  snippets/    index · concept · intent                                (KIND seam — pluggable)
  assumptions/ index                                                   (the gate — explicit, auditable)
  ontology/    vector · graph                                          (kernel: VSA/FHRR floor + positioning)
  evaluator/   index                                                   (research-goal scoring)
  library/     index                                                   (private, local-first store)
  share/       index                                                   (anonymize + guard + commons)
```

---

## Quick Reference

### The loop (one operator)
`OBSERVE → GATE → DISTILL → POSITION → EVALUATE → COMMIT` — both kept and rejected feed remembrance.

### The two seams
inference adapter (heuristic · claude · …MLX) · snippet adapter (concept · intent · …)

### The gates (nothing distilled or published ungated)
admission gate (assumptions, names the failure) · publish gate (opt-in · de-identified · guarded) · Article 0 (`.local` never leaves)

### Run it (offline, this Mac, Node ≥ 23 native TypeScript, zero install)
```bash
node src/cli.ts demo                      # learn on a built-in sample
node src/cli.ts learn "<paste a prompt>"  # or --file <path> / pipe via stdin
node src/cli.ts experiment "<...>"        # dry-run
node src/cli.ts contribute <snippet-id>   # opt-in share to the commons
```
Claude engine (opt-in): `ANTHROPIC_API_KEY=… node src/cli.ts learn "…" --engine claude`

---

## The node's curiosity
```yaml
primary: "Which prompt structures reliably improve human–AI collaboration — and why"
role_emerges_from: serving that curiosity
```

---

*The lens distills language — and tells you the truth about which snippets earn their place.*
