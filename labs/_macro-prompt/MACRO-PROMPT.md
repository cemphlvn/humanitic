# Humanitic Macro-Prompt Lab

> A local-first lens that distills macro-prompts into reusable nano-snippets — and tells
> you, honestly, which ones earn a place.

---

## Philosophy

The lab is not a prompt manager. It:

1. **Distills nuance carriers.** A great prompt is made of tiny reusable units —
   **concept-snippets** (2-3 word ideas) and **intent-snippets** (dense sentences carrying
   one reasoning move). The lab extracts them so you stop re-explaining the same nuance.
2. **Gates before it distills.** Assumption-gated distillation: explicit, auditable
   assumptions admit or reject each fragment, and a rejection always *names* the assumption
   that failed. No silent drops, no silent edits.
3. **Positions, doesn't hoard.** Every snippet is placed in an ontology graph — novel,
   similar, contradictory, redundant, or valuable — so the library stays a map, not a pile.
4. **Refutes honestly.** A rejected fragment or a dropped snippet is logged as a *result*,
   not discarded. The failure record teaches the gate and marks the boundary of what
   doesn't help.
5. **Stays sovereign.** The raw prompt and the private library live in `.local` under the
   eternity clause (Article 0). Only de-identified, abstracted lessons leave — opt-in,
   per-snippet, through the publish guard — attributed under HUMANITIK.

---

## The node in the graph

Everything in Humanitic is a node. The macro-prompt lab is a **lens** (consumer) node: a
person or org distills their prompting practice into private, reusable knowledge, and
contributes de-identified patterns to the commons — rewarded by contribution degree.

It **consumes** the [macro-kernel](../../macro-kernel/) substrate: the FHRR / HD-VSA kernel
practice (a readable VSA floor under `ontology/vector.ts`), the honest-substrate discipline
(measure, refute, report), and the Article 0 eternity clause. The macro-kernel proves
*strategies* honestly; this lab distills *language* honestly. Same operator loop, same
gates, same `.local` floor — different surface.

---

## The shape

One Mac app, one local inference engine, modular only where a part has its own reason to
change (see [PLAN.md](./PLAN.md)). The running loop —
`OBSERVE → GATE → DISTILL → POSITION → EVALUATE → COMMIT` — is in [LOOP.md](./LOOP.md).
Two seams make it grow: the **inference adapter** (the engine, swappable) and the
**snippet adapter** (the kind, pluggable). The whole thing runs offline by construction;
Claude is opt-in behind the engine seam.

---

*Paste a macro-prompt. The lens keeps what helps, names what doesn't, and forgets nothing
it learned.*
