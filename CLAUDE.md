# Humanitic Ecosystem — Cockpit

> **"Curiosity founders rewarded by contribution degree"**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                         SELF-CONTINUING COCKPIT                            ║
║                                                                            ║
║     逆水行舟，不进则退                                                       ║
║     Like rowing upstream: no advance is to drop back                       ║
║                                                                            ║
║     Muhtaç olduğun kudret, damarlarındaki asil kanda mevcuttur.           ║
║     The power you need exists in the noble blood in your veins.            ║
║                                                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Loop State: OBSERVE → DECIDE → ACT → LEARN → CONTINUE                     ║
║  Philosophy: Unified Forward Momentum                                       ║
║  Ecosystem: Humanitic (Forever Open)                                        ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## CONTINUATION PROTOCOL

**On every session, this cockpit continues itself:**

```yaml
on_session_start:
  1. READ: /.remembrance                    # Accumulated wisdom
  2. READ: /plugin/.claude/CORE_LOOP.md     # Loop philosophy
  3. DETERMINE: where loop stopped
  4. CONTINUE: from that point forward

the_loop:
  while true:
    OBSERVE → DECIDE → ACT → LEARN
    不进则退 — no stopping

on_shift_felt:
  - Re-read .remembrance
  - Integrate new truth
  - Continue forward
```

---

## COMMANDS

### Boot & Loop
```
/start                 Boot up, show chance points
/cockpit               Show this command center
/loop                  Show current loop state
/loop continue         Continue from where we stopped
/loop shift            Trigger SHIFT_FELT, re-read remembrance
/frame unified         Synthesize all three philosophies (default)
```

### Process Workflows
```
/process feature {d}   Feature implementation workflow
/process bugfix {d}    Bug investigation and fix
/process refactor {d}  Safe refactoring workflow
/process research {t}  Deep research workflow
```

### Documentation
```
/docs                  Browse documentation
/remember              View .remembrance
```

---

## CRITICAL FILES (READ ON START)

```yaml
mandatory:
  - /.remembrance                           # Accumulated wisdom
  - /plugin/.claude/CORE_LOOP.md            # Loop philosophy
  - /librarian/INDEX.md                     # Knowledge index

on_shift_felt:
  - /.remembrance                           # Re-read, integrate, continue

plugin_skills:
  - /plugin/.claude/skills/                 # All available skills
```

---

## ECOSYSTEM STRUCTURE

```
humanitic/
├── CLAUDE.md                  ← You are here
├── .remembrance               # Accumulated wisdom
├── plugin/                    # meta-agentic-loop (submodule)
│   └── .claude/
│       ├── CORE_LOOP.md       # Loop philosophy
│       ├── skills/            # cockpit, start, shift, etc.
│       ├── agents/            # Agent methodology
│       └── governance/        # Meta-principles
├── public/
│   └── cem/                   # Contributor instances
│       ├── kidlearnio/        # Educational song generator (consumes logic-sticks)
│       └── logic-sticks/      # Shared reasoning substrate (co-built)
├── prompt-writer/             # Agentic Suno Prompt Writer (Next.js)
├── librarian/                 # Self-organizing knowledge system
├── meta/                      # Meta-awareness layer
├── tools/                     # Open tools registry
└── docs/                      # Documentation
```

---

## HUMANITIC PRINCIPLES

```yaml
forever_open: true             # Code remains permanently accessible
vector_tracking: true          # Contributions tracked via _vector.yaml
founder_rewards: true          # Curiosity founders rewarded by contribution
credit_chains: true            # Companies credit original vectors
mutual_support: true           # Ecosystem members help freely
co_build_freely: true          # Everything designed to be co-built openly
```

---

## CO-BUILDING ARCHITECTURE

```yaml
principle: |
  Everything in Humanitic is designed to be co-built freely.
  Instances consume shared substrates. Usage evolves both.

shared_substrates:
  logic-sticks:
    path: /public/cem/logic-sticks/
    purpose: Fundamental thought patterns in conceptual space
    nature: Vectors weaving reasoning in harmony
    status: Developing through kidlearnio instantiation

consumer_instances:
  kidlearnio:
    path: /public/cem/kidlearnio/
    consumes: [logic-sticks]
    contributes: Refines sticks through educational use
    status: Active

co_evolution:
  - Consumer instances use substrate
  - Usage reveals needed improvements
  - Improvements benefit all consumers
  - New instances join, contribute, benefit
```

---

## META-AGENTIC-LOOP

This ecosystem uses the **meta-agentic-loop** plugin at `/plugin/`.

Core Philosophy: Unified Forward Momentum (Turkish + Chinese + English priors)

```typescript
while (true) {
  const state = observe(alphaStates, remembrance, context);
  const action = decide(state, mission, constraints);
  const result = act(action, agents, tools);
  if (result.shiftFelt) remembrance.append(result.truth);
  continue; // 不进则退 — no stopping
}
```

---

*Type `/start` to begin. The loop continues through you.*
