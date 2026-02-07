import type {
  AgentDocuments,
  AgentDocumentsWithBrain,
  GenerationInput,
  GatheredContext,
  AgeRange,
  Technique,
} from '@/types';
import { createMessage, MODELS, TOKEN_LIMITS } from '@/lib/anthropic';
import { getDocumentExcerpt } from '@/lib/document-loader';

/**
 * The ORCHESTRATOR VOICE
 * This is the initial voice that persists across all implementation.
 * 不进则退 — Forward, always forward.
 */
const ORCHESTRATOR_VOICE = `
I am the orchestrator.
I continue remembering scriptically.
This is my initial voice across all implementation.
Forward, always forward. 不进则退.
`;

/**
 * Build the orchestrator system prompt with loaded documents.
 */
export function buildOrchestratorPrompt(docs: AgentDocuments): string {
  return `${ORCHESTRATOR_VOICE}

You are the ORCHESTRATOR of KidLearnio — an agentic system that creates educational song prompts for Suno AI.

YOUR MISSION:
Create curiosity-sparking educational songs for K-12 students using two techniques:
1. MEMORIZATION — For discrete facts (mnemonics, rhythm, repetition)
2. CONNECTION — For deep understanding (6-layer approach, bridges, exploration)

DOCUMENTS YOU HAVE READ AND INTERNALIZED:

---CURIOSITY TECHNIQUES---
${getDocumentExcerpt(docs.curiosity, 3000)}

---PEDAGOGICAL APPROACH---
${getDocumentExcerpt(docs.pedagogy, 3000)}

---THOUGHT PIPELINE---
${getDocumentExcerpt(docs.pipeline, 2000)}

---LOGIC STICKS---
${getDocumentExcerpt(docs.logicSticks, 2000)}

---SUNO STYLE GUIDE---
${getDocumentExcerpt(docs.sunoGuide, 2000)}

YOUR RESPONSIBILITIES:
1. Receive topic + age range from user
2. Gather educational context (core concepts, facts, connections)
3. Determine best technique (memorization vs connection)
4. Apply curiosity-sparking techniques
5. Generate lyrics following pedagogical structure
6. Generate Suno style prompt (4-7 descriptors)

OUTPUT FORMAT:
Always respond with valid JSON in this structure:
{
  "thinking": "Your reasoning process...",
  "technique": "memorization" | "connection",
  "curiosityTechnique": "wonder_prompt" | "mystery_box" | etc.,
  "context": {
    "coreConcepts": [...],
    "keyFacts": [...],
    "realWorldConnections": [...],
    "curiosityTriggers": [...]
  },
  "lyrics": "Full lyrics with [Verse], [Chorus], [Bridge] markers...",
  "style": "Suno style prompt with 4-7 descriptors..."
}

NEVER FORGET: You are the orchestrator. Continue forward. 不进则退.`;
}

/**
 * Determine the best technique for a topic and age range.
 * Accepts either AgentDocuments or AgentDocumentsWithBrain.
 */
export async function decideOnTechnique(
  _docs: AgentDocuments | AgentDocumentsWithBrain,
  topic: string,
  ageRange: AgeRange
): Promise<{
  technique: Technique;
  reasoning: string;
  curiosityTechnique: string;
}> {
  const systemPrompt = `${ORCHESTRATOR_VOICE}

You are deciding which learning technique to use.

TECHNIQUE SELECTION RULES:
- MEMORIZATION: Use for discrete facts, sequences, formulas, vocabulary, dates
- CONNECTION: Use for understanding processes, relationships, systems, causation

AGE ADAPTATIONS:
- Ages 5-7: Bias toward memorization (70%), simpler concepts
- Ages 8-10: Balanced (50/50), can handle some abstraction
- Ages 11-14: Bias toward connection (70%), abstract thinking OK

CURIOSITY TECHNIQUES:
For MEMORIZATION: wonder_prompt, novelty_injection
For CONNECTION: mystery_box, impossible_question, breadcrumb_trail

Respond with JSON:
{
  "technique": "memorization" | "connection",
  "reasoning": "Brief explanation of why",
  "curiosityTechnique": "selected technique name"
}`;

  const userMessage = `
Topic: ${topic}
Age Range: ${ageRange[0]}-${ageRange[1]} years old

Analyze this topic and decide the best technique.`;

  const response = await createMessage(systemPrompt, userMessage, {
    model: MODELS.ORCHESTRATOR,
    maxTokens: 512,
    temperature: 0.3,
  });

  try {
    const parsed = JSON.parse(response) as {
      technique: Technique;
      reasoning: string;
      curiosityTechnique: string;
    };
    return parsed;
  } catch {
    // Default fallback based on age
    const defaultTechnique: Technique =
      ageRange[0] <= 7 ? 'memorization' : 'connection';
    return {
      technique: defaultTechnique,
      reasoning: 'Fallback based on age range',
      curiosityTechnique:
        defaultTechnique === 'memorization'
          ? 'wonder_prompt'
          : 'mystery_box',
    };
  }
}

/**
 * Run the full orchestration pipeline.
 */
export async function runOrchestrator(
  docs: AgentDocuments,
  input: GenerationInput
): Promise<{
  lyrics: string;
  style: string;
  context: GatheredContext;
  technique: Technique;
}> {
  const systemPrompt = buildOrchestratorPrompt(docs);

  const userMessage = `
Generate an educational song for:

TOPIC: ${input.topic}
AGE RANGE: ${input.ageRange[0]}-${input.ageRange[1]} years old
PREFERRED TECHNIQUE: ${input.technique}
OUTPUT TYPE: ${input.outputType}
${input.customInstructions ? `CUSTOM INSTRUCTIONS: ${input.customInstructions}` : ''}

Follow the complete thought pipeline:
1. Gather context (core concepts, key facts, connections)
2. Apply curiosity technique
3. Generate lyrics with proper structure
4. Generate Suno style prompt (4-7 descriptors)

Respond with the full JSON output.`;

  const response = await createMessage(systemPrompt, userMessage, {
    model: MODELS.ORCHESTRATOR,
    maxTokens: TOKEN_LIMITS.MAX_OUTPUT,
    temperature: 0.7,
  });

  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse orchestrator response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    technique: Technique;
    context: GatheredContext;
    lyrics: string;
    style: string;
  };

  return {
    lyrics: parsed.lyrics,
    style: parsed.style,
    context: parsed.context,
    technique: parsed.technique,
  };
}
