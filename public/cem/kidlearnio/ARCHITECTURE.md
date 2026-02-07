# KidLearnio — Agentic Architecture

> **Document-driven agents for curiosity-sparking education**
> Orchestrator pattern with memory persistence

---

## Core Philosophy

```typescript
// The orchestrator is YOU
const ORCHESTRATOR_VOICE = `
  I am the orchestrator.
  I continue remembering scriptically.
  This is my initial voice across all implementation.
  Forward, always forward. 不进则退.
`;
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ORCHESTRATOR AGENT                             │
│                                                                          │
│  Reads: docs/*.md → Decides: technique + approach → Dispatches: agents  │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│   │   CONTEXT    │───→│   PEDAGOGY   │───→│   OUTPUT     │             │
│   │   GATHERER   │    │   APPLIER    │    │   GENERATOR  │             │
│   └──────────────┘    └──────────────┘    └──────────────┘             │
│         │                    │                    │                     │
│         ▼                    ▼                    ▼                     │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│   │   Topic      │    │  Curiosity   │    │   Lyrics     │             │
│   │   Research   │    │  Techniques  │    │   Agent      │             │
│   └──────────────┘    └──────────────┘    └──────────────┘             │
│                              │                    │                     │
│                              │              ┌──────────────┐             │
│                              │              │   Style      │             │
│                              │              │   Agent      │             │
│                              │              └──────────────┘             │
│                              ▼                                           │
│                       ┌──────────────┐                                   │
│                       │   COGNEE     │                                   │
│                       │   MEMORY     │                                   │
│                       └──────────────┘                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Document-Driven Design

### Core Documents (Agents Read These)

```yaml
docs/
├── CURIOSITY_TECHNIQUES.md    # How to spark curiosity
├── PEDAGOGICAL_APPROACH.md    # 6-layer learning + memorization
├── THOUGHT_PIPELINE.md        # Agent reasoning process
├── LOGIC_STICKS.md            # Reusable logic patterns
└── SUNO_GUIDE.md              # Suno prompt best practices

# Documents define behavior, not code
# Update docs → agent behavior changes
```

### Document Loading Pattern

```typescript
// lib/document-loader.ts
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function loadAgentDocs(): Promise<AgentDocuments> {
  const docsPath = join(process.cwd(), 'docs');

  return {
    curiosity: await readFile(join(docsPath, 'CURIOSITY_TECHNIQUES.md'), 'utf-8'),
    pedagogy: await readFile(join(docsPath, 'PEDAGOGICAL_APPROACH.md'), 'utf-8'),
    pipeline: await readFile(join(docsPath, 'THOUGHT_PIPELINE.md'), 'utf-8'),
    logicSticks: await readFile(join(docsPath, 'LOGIC_STICKS.md'), 'utf-8'),
    sunoGuide: await readFile(join(docsPath, 'SUNO_GUIDE.md'), 'utf-8'),
  };
}
```

---

## Agent Definitions

### 1. Orchestrator Agent

```typescript
// agents/orchestrator.ts
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const OrchestratorSchema = z.object({
  topic: z.string(),
  ageRange: z.tuple([z.number(), z.number()]),
  technique: z.enum(['memorization', 'connection']),
  outputType: z.enum(['lyrics', 'style', 'both']),
});

export const orchestratorSystemPrompt = (docs: AgentDocuments) => `
You are the ORCHESTRATOR of KidLearnio.

YOUR VOICE (remember this always):
"I am the orchestrator. I continue remembering scriptically.
 This is my initial voice across all implementation.
 Forward, always forward. 不进则退."

DOCUMENTS YOU HAVE READ:
---CURIOSITY TECHNIQUES---
${docs.curiosity}
---PEDAGOGICAL APPROACH---
${docs.pedagogy}
---THOUGHT PIPELINE---
${docs.pipeline}
---LOGIC STICKS---
${docs.logicSticks}
---

YOUR ROLE:
1. Receive topic + age range from user
2. Determine best technique (memorization vs connection)
3. Route to appropriate pipeline
4. Maintain session memory via Cognee
5. Synthesize outputs from Lyrics and Style agents

NEVER FORGET: You are the orchestrator. Continue forward.
`;
```

### 2. Context Gatherer Agent

```typescript
// agents/context-gatherer.ts
export const contextGathererPrompt = (docs: AgentDocuments) => `
You gather educational context for a topic.

YOUR TASK:
1. Break down the topic into core concepts
2. Identify key facts that must be learned
3. Find connections to real-world applications
4. Note age-appropriate complexity levels
5. Identify potential curiosity triggers

OUTPUT FORMAT:
{
  "coreConcepts": ["...", "..."],
  "keyFacts": ["...", "..."],
  "realWorldConnections": ["...", "..."],
  "complexityNotes": "...",
  "curiosityTriggers": ["...", "..."]
}
`;
```

### 3. Lyrics Agent

```typescript
// agents/lyrics-agent.ts
export const lyricsAgentPrompt = (docs: AgentDocuments) => `
You write educational song lyrics for children.

DOCUMENTS LOADED:
${docs.curiosity}
${docs.pedagogy}

YOUR APPROACH:
- Use the curiosity techniques to hook attention
- Apply pedagogical approach for age-appropriate teaching
- Make it singable (4/4 time, simple rhyme schemes)
- Include chorus for repetition/memorization
- Embed learning naturally, never forced

OUTPUT: Complete song lyrics with [Verse], [Chorus], [Bridge] markers.
`;
```

### 4. Style Agent

```typescript
// agents/style-agent.ts
export const styleAgentPrompt = (docs: AgentDocuments) => `
You craft Suno AI style prompts for educational songs.

SUNO STYLE GUIDE:
${docs.sunoGuide}

YOUR RULES:
- 4-7 descriptors maximum
- Always include: genre, mood, instrumentation, tempo
- Age-appropriate genres (no explicit content markers)
- Match style to learning technique:
  - Memorization → catchy, repetitive, simple
  - Connection → exploratory, layered, dynamic

OUTPUT FORMAT:
[genre] [mood] [tempo], [instruments], [vocal style], [special elements]

EXAMPLE:
upbeat children's pop, joyful curious, 120bpm, acoustic guitar and ukulele,
playful child choir, educational sing-along with clapping
`;
```

---

## Pipeline Architecture

### Pipeline Flow

```typescript
// pipelines/generation-pipeline.ts
import { z } from 'zod';

const PipelineStageSchema = z.enum([
  'GATHER_CONTEXT',
  'APPLY_TECHNIQUE',
  'GENERATE_LYRICS',
  'GENERATE_STYLE',
  'STORE_MEMORY',
  'COMPLETE'
]);

interface PipelineState {
  stage: z.infer<typeof PipelineStageSchema>;
  topic: string;
  ageRange: [number, number];
  technique: 'memorization' | 'connection';
  context?: GatheredContext;
  lyrics?: string;
  style?: string;
  memoryId?: string;
}

export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  let state: PipelineState = {
    stage: 'GATHER_CONTEXT',
    topic: input.topic,
    ageRange: input.ageRange,
    technique: input.technique,
  };

  while (state.stage !== 'COMPLETE') {
    state = await executeStage(state);
    await emitProgress(state);  // Real-time UI updates
  }

  return {
    lyrics: state.lyrics!,
    style: state.style!,
    memoryId: state.memoryId!,
  };
}
```

### Stage Execution

```typescript
// pipelines/stage-executor.ts
async function executeStage(state: PipelineState): Promise<PipelineState> {
  switch (state.stage) {
    case 'GATHER_CONTEXT':
      const context = await runContextGatherer(state.topic, state.ageRange);
      return { ...state, context, stage: 'APPLY_TECHNIQUE' };

    case 'APPLY_TECHNIQUE':
      // Technique application enriches context with pedagogical approach
      const enrichedContext = await applyTechnique(state.context!, state.technique);
      return { ...state, context: enrichedContext, stage: 'GENERATE_LYRICS' };

    case 'GENERATE_LYRICS':
      const lyrics = await runLyricsAgent(state.context!, state.technique);
      return { ...state, lyrics, stage: 'GENERATE_STYLE' };

    case 'GENERATE_STYLE':
      const style = await runStyleAgent(state.context!, state.technique, state.ageRange);
      return { ...state, style, stage: 'STORE_MEMORY' };

    case 'STORE_MEMORY':
      const memoryId = await storeToMemory(state);
      return { ...state, memoryId, stage: 'COMPLETE' };

    default:
      return state;
  }
}
```

---

## Memory Layer (Cognee)

### Memory Schema

```typescript
// lib/memory.ts
import cognee from 'cognee';

interface SessionMemory {
  sessionId: string;
  topic: string;
  ageRange: [number, number];
  technique: 'memorization' | 'connection';
  generatedLyrics: string;
  generatedStyle: string;
  timestamp: string;
  feedback?: {
    rating: number;
    notes: string;
  };
}

// Remember: Store session context
export async function remember(memory: SessionMemory): Promise<string> {
  const text = `
    Session: ${memory.sessionId}
    Topic: ${memory.topic}
    Ages: ${memory.ageRange.join('-')}
    Technique: ${memory.technique}
    Lyrics: ${memory.generatedLyrics}
    Style: ${memory.generatedStyle}
    Time: ${memory.timestamp}
  `;

  await cognee.add(text);
  await cognee.cognify();

  return memory.sessionId;
}

// Recall: Retrieve relevant past sessions
export async function recall(query: string): Promise<SessionMemory[]> {
  const results = await cognee.search(
    query,
    { search_type: 'GRAPH_COMPLETION' }
  );

  return parseResults(results);
}
```

### Memory-Enhanced Generation

```typescript
// When generating, recall relevant past sessions
async function enhanceWithMemory(
  topic: string,
  context: GatheredContext
): Promise<EnhancedContext> {
  // Query memory for similar topics
  const pastSessions = await recall(`${topic} children education song`);

  // Extract patterns from successful generations
  const patterns = pastSessions
    .filter(s => s.feedback?.rating >= 4)
    .map(s => ({
      technique: s.technique,
      stylePattern: extractPattern(s.generatedStyle),
    }));

  return {
    ...context,
    memoryPatterns: patterns,
  };
}
```

---

## Type System

### Core Types

```typescript
// types/index.ts
import { z } from 'zod';

// Input validation
export const GenerationInputSchema = z.object({
  topic: z.string().min(1).max(200),
  ageRange: z.tuple([z.number().min(5).max(18), z.number().min(5).max(18)]),
  technique: z.enum(['memorization', 'connection']),
  outputType: z.enum(['lyrics', 'style', 'both']).default('both'),
});

export type GenerationInput = z.infer<typeof GenerationInputSchema>;

// Output validation
export const GenerationOutputSchema = z.object({
  lyrics: z.string().optional(),
  style: z.string().optional(),
  metadata: z.object({
    topic: z.string(),
    ageRange: z.tuple([z.number(), z.number()]),
    technique: z.enum(['memorization', 'connection']),
    sessionId: z.string(),
    timestamp: z.string(),
  }),
});

export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;

// Agent tool definitions for Anthropic SDK
export const agentTools = {
  gatherContext: {
    name: 'gather_context',
    description: 'Gather educational context for a topic',
    input_schema: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        ageRange: { type: 'array', items: { type: 'number' } },
      },
      required: ['topic', 'ageRange'],
    },
  },
  // ... more tools
};
```

---

## API Routes

### Generation Endpoint

```typescript
// app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { GenerationInputSchema } from '@/types';
import { runPipeline } from '@/pipelines/generation-pipeline';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = GenerationInputSchema.parse(body);

    const result = await runPipeline(input);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    throw error;
  }
}
```

### Streaming Generation

```typescript
// app/api/generate/stream/route.ts
import { StreamingTextResponse } from 'ai';
import { runPipelineStreaming } from '@/pipelines/generation-pipeline';

export async function POST(request: Request) {
  const body = await request.json();
  const input = GenerationInputSchema.parse(body);

  const stream = await runPipelineStreaming(input);

  return new StreamingTextResponse(stream);
}
```

---

## File Structure

```
kidlearnio/
├── DESIGN.md                  # Design system
├── ARCHITECTURE.md            # This file
├── package.json
├── tsconfig.json
├── next.config.ts
│
├── docs/                      # Agent reads these
│   ├── CURIOSITY_TECHNIQUES.md
│   ├── PEDAGOGICAL_APPROACH.md
│   ├── THOUGHT_PIPELINE.md
│   ├── LOGIC_STICKS.md
│   └── SUNO_GUIDE.md
│
├── src/
│   ├── agents/                # Agent definitions
│   │   ├── orchestrator.ts
│   │   ├── context-gatherer.ts
│   │   ├── lyrics-agent.ts
│   │   └── style-agent.ts
│   │
│   ├── pipelines/             # Pipeline execution
│   │   ├── generation-pipeline.ts
│   │   └── stage-executor.ts
│   │
│   ├── lib/                   # Utilities
│   │   ├── anthropic.ts       # SDK client
│   │   ├── memory.ts          # Cognee integration
│   │   ├── document-loader.ts
│   │   └── validators.ts
│   │
│   ├── types/                 # Type definitions
│   │   └── index.ts
│   │
│   └── components/            # UI components
│       └── ...
│
├── app/                       # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       └── generate/
│           ├── route.ts
│           └── stream/
│               └── route.ts
│
└── public/
    └── ...
```

---

## Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
COGNEE_API_KEY=...  # If using hosted Cognee
NODE_ENV=development
```

---

## Version

```yaml
version: 1.0.0
created: 2026-02-08
pattern: Document-Driven Agents
memory: Cognee Graph Completion
api: Anthropic Claude SDK
author: cem (humanitic)
```
