# Suno Prompt Writer — Agentic Educational Music Generator

An agentic prompt writer that generates **Lyrics** and **Style** prompts for [Suno AI](https://suno.com), designed for K-24 education. Every prompt is engineered to teach concepts through curiosity-sparking songs.

## Architecture

The system follows a strict agentic pipeline where the **Cognitive Strategy Agent (CSA)** is consulted before every generation:

```
User Input → CSA (reads all docs) → Lyrics Agent → Style Agent → Memory Agent
```

### Agents

| Agent | Role |
|-------|------|
| **Orchestrator** | Routes, sequences, manages the pipeline |
| **Cognitive Strategy Agent (CSA)** | Gatekeeper — selects pipeline, logic stick, curiosity technique |
| **Lyrics Agent** | Generates structured Suno lyrics with educational content |
| **Style Agent** | Generates Suno style descriptors (genre, mood, tempo, instruments) |
| **Memory Agent** | Stores session context, builds topic knowledge graph |

### Documents the Agents Read

| Document | Purpose |
|----------|---------|
| `docs/thought-pipelines.md` | 5 cognitive flow sequences |
| `docs/logic-sticks.md` | 6 logical scaffolding patterns |
| `docs/curiosity-sparking-techniques.md` | 7 curiosity ignition methods |
| `docs/memorization-techniques.md` | 6 memorization approaches |
| `docs/ARCHITECTURE.md` | Full system architecture |
| `docs/design.md` | UI/UX design specification |

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript** (strict mode)
- **Zod** (type-safe schema validation)
- **MDB React UI Kit** (Bootstrap Material Design)
- **Anthropic Claude API** (agent intelligence)
- **Cognee** (knowledge graph memory layer)

## Getting Started

```bash
cd prompt-writer
npm install
cp .env.example .env.local
# Add your Anthropic API key to .env.local
npm run dev
```

Visit `http://localhost:3000` for the Generator, `http://localhost:3000/style-builder` for the visual Style Builder.

## Pages

- **`/`** — Full prompt generator with CSA pipeline visualization
- **`/style-builder`** — Frontend-only visual style prompt builder

## API

- **`POST /api/generate`** — Full pipeline: CSA → Lyrics → Style → Memory
- **`GET /api/sessions`** — Retrieve session history

## The Secret

> Curiosity is not a trick. It is respect. We respect children enough to believe they WANT to understand the universe. We don't dumb things down — we light them up.
