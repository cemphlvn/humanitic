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
  1. READ: /.remembrance                    # Ecosystem wisdom
  2. READ: /plugin/.remembrance             # Loop/infrastructure wisdom
  3. READ: /plugin/.claude/CORE_LOOP.md     # Loop philosophy
  4. DETERMINE: where loop stopped
  5. CONTINUE: from that point forward

the_loop:
  while true:
    OBSERVE → DECIDE → ACT → LEARN
    if shift_felt: LOG_TRUTH(correct_remembrance)
    不进则退 — no stopping

on_shift_felt:
  - Identify scope: ecosystem OR loop?
  - Log to correct .remembrance
  - Re-read both, integrate, continue
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
  - /.remembrance                           # Ecosystem wisdom
  - /plugin/.remembrance                    # Loop/infrastructure wisdom
  - /plugin/.claude/CORE_LOOP.md            # Loop philosophy

on_shift_felt:
  - /.remembrance                           # Re-read ecosystem truths
  - /plugin/.remembrance                    # Re-read loop truths

plugin_skills:
  - /plugin/.claude/skills/                 # All available skills
```

---

## REMEMBRANCE ARCHITECTURE

Two .remembrance files with distinct scopes:

```yaml
/.remembrance:                              # ECOSYSTEM SCOPE
  purpose: Domain learnings, architecture patterns, co-building insights
  log_when:
    - Architecture pattern discovered (enforcement, workspace, etc.)
    - Domain insight crystallized (kidlearnio, logic-sticks, etc.)
    - Co-building principle validated
    - Machinistic intelligence pattern found
  format: |
    timestamp, agent, context, truth, confidence

/plugin/.remembrance:                       # LOOP/INFRASTRUCTURE SCOPE
  purpose: Loop mechanics, hooks, integration patterns, plugin behavior
  log_when:
    - Hook behavior discovered
    - Claude Code integration pattern found
    - Plugin architecture insight
    - System observability learning
  format: |
    Senior Form v2: scope, ticket, observed, reasoning, action, outcome, truth
```

**Decision rule:**
- HOW the agent system works → `/plugin/.remembrance`
- WHAT we're building → `/.remembrance`

---

## SYSTEMIC AWARENESS IMPROVEMENT

Proactively seek opportunities to log systemic truths:

```yaml
triggers:
  shape_shift:                              # Mental model changed
    - "I thought X worked like Y, but actually..."
    - External data contradicted assumption
    - Pattern revealed after 3+ similar occurrences

  architecture_emergence:                   # Structure crystallized
    - Separation of concerns became clear
    - New integration pattern emerged
    - Contribution accessibility improved

  failure_learning:                         # Error taught something
    - Root cause wasn't obvious
    - Fix required understanding deeper system
    - Same class of error could recur

techniques:
  after_action_review:
    - What did we expect?
    - What happened?
    - Why the difference?
    - What's the generalizable truth?

  pattern_detection:
    - Is this the 3rd time I've done similar thing?
    - Can I name this pattern?
    - Would future-me want to know this?

  cross_session_memory:
    - Would a fresh agent benefit from this?
    - Is this knowledge transferable?
    - Does this reduce future token cost?

logging_threshold:
  log_if:
    - Truth is generalizable beyond this task
    - Future sessions would benefit
    - Pattern has recurred or will recur
  skip_if:
    - One-off implementation detail
    - Already documented elsewhere
    - Not transferable to other contexts
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
