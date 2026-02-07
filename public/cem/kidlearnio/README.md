# KidLearnio

> **Agentic Suno prompt writer for K-12 curiosity-driven learning**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  A Humanitic Instance                                                      ║
║  Curiosity founders rewarded by contribution degree                        ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

## What is KidLearnio?

KidLearnio uses AI agents to create educational song prompts for [Suno AI](https://suno.ai). Transform any topic into fun, memorable music for K-12 students.

**Two learning approaches:**
- **Memorization** — For facts, sequences, formulas (mnemonics, rhythm, repetition)
- **Connection** — For deep understanding (6-layer pedagogical approach)

## Features

- Document-driven agents that read `.md` files for behavior
- Curiosity-sparking techniques based on education research
- Age-adaptive content (5-18 years)
- Suno-optimized style prompts (4-7 descriptors)
- Session memory with Cognee integration

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your ANTHROPIC_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ORCHESTRATOR AGENT                             │
│  Reads: docs/*.md → Decides: technique → Dispatches: agents             │
├─────────────────────────────────────────────────────────────────────────┤
│   CONTEXT GATHERER → PEDAGOGY APPLIER → LYRICS AGENT → STYLE AGENT     │
│                              ↓                                           │
│                        COGNEE MEMORY                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Knowledge Documents

Agents read these `.md` files at runtime:

| Document | Purpose |
|----------|---------|
| `docs/CURIOSITY_TECHNIQUES.md` | How to spark curiosity |
| `docs/PEDAGOGICAL_APPROACH.md` | 6-layer learning + memorization |
| `docs/THOUGHT_PIPELINE.md` | Agent reasoning process |
| `docs/LOGIC_STICKS.md` | Reusable logic patterns |
| `docs/SUNO_GUIDE.md` | Suno prompt best practices |

**Update these documents to change agent behavior without modifying code.**

## Tech Stack

- **Next.js 16** — App Router, Server Actions
- **MDB React** — Material Design Bootstrap
- **Anthropic SDK** — Claude for agents
- **Zod** — Type-safe validation
- **Cognee** — Memory layer (optional)

## Humanitic License

This is a Humanitic instance. See [/public/README.md](/../../README.md) for principles:

- **Forever Open** — Code remains permanently accessible
- **Vector Tracking** — Contributions tagged with user + timestamp
- **Founder Rewards** — Curiosity founders rewarded by contribution degree
- **Credit Chains** — Derivative works credit original vectors

## Contributing

```bash
# Tag your contribution
./scripts/tag-contribution.sh public/cem/kidlearnio "description"
```

## Research Sources

- [Curiosity in Classrooms Framework](https://pmc.ncbi.nlm.nih.gov/articles/PMC9022842/)
- [Knowles' Andragogy Principles](https://research.com/education/the-andragogy-approach)
- [Suno Prompt Guide](https://travisnicholson.medium.com/complete-list-of-prompts-styles-for-suno-ai-music-2024-33ecee85f180)
- [MDB React Integration](https://mdbootstrap.com/docs/react/getting-started/next/)

---

*Forward, always forward. 不进则退.*
