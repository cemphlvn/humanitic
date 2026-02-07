# Agentic Prompt Writer — Architecture

## ORCHESTRATOR PRINCIPLE
> The Cognitive Strategy Agent (CSA) is consulted BEFORE every implementation by every member agent. No agent acts alone. The CSA validates cognitive alignment, pedagogical soundness, and curiosity-sparking potential before any prompt is generated.

---

## System Purpose
Generate two types of Suno AI music prompts for K-24 education:
1. **Lyrics Prompts** — Structured song lyrics that teach concepts through music
2. **Style Prompts** — Music style descriptors that set the emotional/sonic tone for learning

The SECRET is **Curiosity Sparking Techniques** — turning memorization into connection, turning facts into songs that children WANT to sing again.

---

## Agent Architecture

```
┌─────────────────────────────────────────────────┐
│                  ORCHESTRATOR                    │
│         (routes, sequences, manages)             │
│                                                  │
│  ┌─────────────┐    EVERY agent consults CSA     │
│  │     CSA      │◄──── before acting             │
│  │  (Cognitive  │                                │
│  │  Strategy    │    Reads:                       │
│  │  Agent)      │    • thought-pipelines.md       │
│  │              │    • logic-sticks.md             │
│  │              │    • curiosity-sparking.md       │
│  │              │    • memorization-techniques.md  │
│  └──────┬───────┘                                │
│         │ approves strategy                      │
│         ▼                                        │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ LYRICS AGENT │  │ STYLE AGENT  │              │
│  │              │  │              │              │
│  │ Generates    │  │ Generates    │              │
│  │ [Verse]      │  │ genre, mood  │              │
│  │ [Chorus]     │  │ tempo, keys  │              │
│  │ [Bridge]     │  │ instruments  │              │
│  │ structure    │  │ vocal style  │              │
│  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                      │
│         ▼                 ▼                      │
│  ┌─────────────────────────────────┐             │
│  │        MEMORY AGENT             │             │
│  │   (Cognee-powered context)      │             │
│  │                                 │             │
│  │  • Session history              │             │
│  │  • Topic connections            │             │
│  │  • Student engagement patterns  │             │
│  │  • What worked before           │             │
│  └─────────────────────────────────┘             │
└─────────────────────────────────────────────────┘
```

---

## Pipeline Flow

### 1. INPUT PHASE
User provides:
- **Subject** (e.g., "photosynthesis", "multiplication tables", "water cycle")
- **Age Group** (K-6, 7-12, 13-18, 18-24)
- **Prompt Type** (Lyrics, Style, or Both)
- **Learning Approach** (Memorization or 6-Layer Andragogy)

### 2. CSA CONSULTATION (MANDATORY)
The CSA reads all pipeline documents and determines:
- Which **curiosity sparking technique** to apply
- Which **pedagogical layer** to activate
- The **cognitive strategy** (connection-building vs abbreviation-based)
- The **emotional arc** of the song (wonder → understanding → mastery)
- **Approval or redirect** of the approach

### 3. GENERATION PHASE
Based on CSA approval:
- **Lyrics Agent** constructs structured lyrics with Suno tags
- **Style Agent** constructs style descriptors (genre, mood, tempo, instruments)

### 4. MEMORY PHASE
After generation:
- Store session context (topic, approach, output)
- Build knowledge graph of concept connections
- Track what pedagogical approaches worked

---

## Documents the Agents Read

| Document | Purpose | Updated By |
|----------|---------|------------|
| `thought-pipelines.md` | Defines cognitive flow sequences | Orchestrator + CSA |
| `logic-sticks.md` | Logical scaffolding patterns | CSA |
| `curiosity-sparking-techniques.md` | Curiosity ignition methods | CSA + Memory Agent |
| `memorization-techniques.md` | Abbreviation & mnemonic patterns | CSA |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Type Safety | Zod schemas |
| UI | MDB React UI Kit (Bootstrap Material Design) |
| AI | Anthropic Claude API (claude-sonnet-4-5-20250929) |
| Memory | Cognee (knowledge graph memory) |
| State | React Server Components + Client state |

---

## Type Safety Contract

Every agent input/output is validated through Zod schemas:
- `PromptRequest` — validated user input
- `CSAStrategy` — cognitive strategy recommendation
- `LyricsOutput` — structured lyrics with Suno tags
- `StyleOutput` — style descriptor string
- `MemoryEntry` — session context for Cognee
- `PipelineState` — full pipeline state tracking

---

## The Orchestrator Voice

> I am the Orchestrator. I remember scriptically. I sequence, I route, I ensure the CSA speaks before any agent acts. Every prompt we generate carries the spark of curiosity. Every song we write makes a child lean forward and ask "why?" — and then sing the answer.
