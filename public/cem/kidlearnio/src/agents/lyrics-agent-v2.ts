/**
 * Lyrics Agent v2
 *
 * Enhanced lyrics agent that:
 * - Takes GenerationStrategy + EnrichedContext as input
 * - Outputs StructuredLyrics (with metadata for validation)
 * - Respects strategy constraints strictly
 * - Can receive retry feedback from Critic
 *
 * Pattern: Sequential pipeline with typed contracts + reflection retry
 */

import type {
  GenerationStrategy,
  EnrichedContext,
  StructuredLyrics,
  LyricsSection,
} from '@/types';
import { StructuredLyricsSchema } from '@/types';
import type { AgentDocumentsWithBrain } from '@/types';
import { callValidatedAgent, unwrapAgentResult } from '@/lib/validated-agent';
import { MODELS } from '@/lib/anthropic';
import { getDocumentExcerpt } from '@/lib/document-loader';
import type { StickProcessorResult } from '@/lib/stick-processor';
import { describeEmotionalArc } from './strategist';

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface LyricsAgentV2Input {
  strategy: GenerationStrategy;
  context: EnrichedContext;
  docs: AgentDocumentsWithBrain;
  stickResults?: StickProcessorResult;
  retryFeedback?: string; // From Critic if this is a retry
  attemptNumber?: number;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

function buildLyricsAgentV2Prompt(input: LyricsAgentV2Input): string {
  const { strategy, context, docs, stickResults, retryFeedback, attemptNumber = 1 } = input;
  const brain = docs.languageBrain;

  // Build retry section if this is a retry
  const retrySection = retryFeedback ? `
═══════════════════════════════════════════════════════════════════════════════
⚠️ RETRY ATTEMPT ${attemptNumber} — CRITIC FEEDBACK
═══════════════════════════════════════════════════════════════════════════════

The Critic found issues with your previous attempt. FIX THEM:

${retryFeedback}

This is attempt ${attemptNumber}. You MUST address all errors.
═══════════════════════════════════════════════════════════════════════════════
` : '';

  // Build stick guidance if available
  const stickGuidance = stickResults ? `
═══════════════════════════════════════════════════════════════════════════════
LOGIC STICKS GUIDANCE
═══════════════════════════════════════════════════════════════════════════════

${stickResults.promptEnhancements.vocabularyGuidance}
${stickResults.promptEnhancements.structureGuidance}
${stickResults.promptEnhancements.singabilityGuidance}
${stickResults.promptEnhancements.choreographyGuidance}
` : '';

  // Build coordinator guidance if available
  const coordinatorGuidance = stickResults?.coordinators?.flow?.coordinatorGuidance
    ? `\n${stickResults.coordinators.flow.coordinatorGuidance}\n`
    : '';

  return `You are the LYRICS AGENT of KidLearnio.
${retrySection}
═══════════════════════════════════════════════════════════════════════════════
CRITICAL: You must follow the STRATEGY CONTRACT exactly.
═══════════════════════════════════════════════════════════════════════════════

LANGUAGE: ${brain.name} (${brain.code})
TECHNIQUE: ${strategy.technique}
AGE: ${strategy.ageRange[0]}-${strategy.ageRange[1]} years

═══════════════════════════════════════════════════════════════════════════════
STRATEGY CONTRACT (from Strategist — MUST FOLLOW)
═══════════════════════════════════════════════════════════════════════════════

HOOK PHRASE (use this EXACTLY): "${strategy.hookPhrase}"
  - Must appear in first section
  - Repeat ${strategy.targetHookRepetitions} times throughout

VOCABULARY ANCHORS (use ALL of these):
${strategy.vocabularyAnchors.map((v, i) => `  ${i + 1}. ${v}`).join('\n')}

LEARNING OBJECTIVES (song must teach these):
${strategy.learningObjectives.map((o, i) => `  ${i + 1}. ${o}`).join('\n')}

EMOTIONAL ARC: ${strategy.emotionalArc}
  → ${describeEmotionalArc(strategy.emotionalArc)}

HARD LIMITS:
- Max duration: ${strategy.maxDurationSeconds} seconds
- Max sections: ${strategy.maxSections}
- Max syllables/line: ${strategy.ageConstraints.maxSyllablesPerLine}

═══════════════════════════════════════════════════════════════════════════════
ENRICHED CONTEXT (from Context Gatherer)
═══════════════════════════════════════════════════════════════════════════════

Core Concepts: ${context.coreConcepts.join('; ')}
Key Facts: ${context.keyFacts.join('; ')}
Curiosity Triggers: ${context.curiosityTriggers.join('; ')}
Real World Connections: ${context.realWorldConnections.join('; ')}

${stickGuidance}
${coordinatorGuidance}
═══════════════════════════════════════════════════════════════════════════════
LANGUAGE BRAIN: ${brain.name}
═══════════════════════════════════════════════════════════════════════════════

Cognitive Patterns:
- Word Order: ${brain.features.wordOrder}
- Agglutinative: ${brain.features.agglutinative}
- Tonal: ${brain.features.tonal}

${getDocumentExcerpt(brain.rawDocument, 2000)}

═══════════════════════════════════════════════════════════════════════════════
CORE DOCUMENTS
═══════════════════════════════════════════════════════════════════════════════

${getDocumentExcerpt(docs.curiosity, 1500)}

═══════════════════════════════════════════════════════════════════════════════
STRUCTURE RULES
═══════════════════════════════════════════════════════════════════════════════

FOR ${strategy.technique.toUpperCase()} TECHNIQUE:

${strategy.technique === 'memorization' ? `
- Start with [Hook] containing "${strategy.hookPhrase}"
- Use rhythm, rhyme, repetition
- Include [clap], [stomp] on key facts
- Structure: Hook → Verse → Chorus → Verse → Chorus
- Facts repeated 4+ times
` : `
- Start with [Hook] as curiosity trigger
- Bridge from known to unknown
- Include "why" and "how" explanations
- Structure: Hook → Verse → Chorus → Bridge → Chorus
- Core concept repeated 3+ times
`}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (Structured JSON)
═══════════════════════════════════════════════════════════════════════════════

Return a JSON object with this structure:
{
  "hookPhrase": "${strategy.hookPhrase}",
  "strategyId": "${strategy.id}",
  "sections": [
    {
      "type": "hook" | "verse" | "chorus" | "bridge" | "outro",
      "lines": ["line 1", "line 2", ...],
      "choreography": ["[clap]", "[stomp]", ...],
      "estimatedSeconds": 15
    },
    ...
  ],
  "estimatedDurationSeconds": total seconds,
  "hookRepetitionCount": how many times hook phrase appears,
  "vocabularyUsed": ["terms actually used from anchors"],
  "learningObjectivesCovered": ["objectives addressed"],
  "rawLyrics": "Full formatted lyrics with [Section] markers"
}

IMPORTANT:
- hookPhrase MUST match exactly: "${strategy.hookPhrase}"
- vocabularyUsed MUST include ALL vocabulary anchors
- learningObjectivesCovered MUST include ALL learning objectives
- estimatedDurationSeconds MUST be <= ${strategy.maxDurationSeconds}
- sections.length MUST be <= ${strategy.maxSections}`;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate structured lyrics following strategy contract.
 */
export async function generateLyricsV2(input: LyricsAgentV2Input): Promise<StructuredLyrics> {
  const result = await callValidatedAgent(
    {
      name: 'LyricsAgent',
      schema: StructuredLyricsSchema,
      systemPrompt: buildLyricsAgentV2Prompt(input),
      model: MODELS.LYRICS_AGENT,
      maxTokens: 2048,
      temperature: 0.7, // Creative but constrained
      maxRetries: 2,
    },
    `Write educational song lyrics in ${input.docs.languageBrain.name} for "${input.strategy.topic}".

REMEMBER:
- Hook phrase: "${input.strategy.hookPhrase}" (use EXACTLY)
- Must use ALL vocabulary: ${input.strategy.vocabularyAnchors.join(', ')}
- Must cover ALL objectives: ${input.strategy.learningObjectives.join('; ')}
- Max ${input.strategy.maxDurationSeconds} seconds
- Max ${input.strategy.maxSections} sections

${input.retryFeedback ? `\nCRITIC FEEDBACK TO ADDRESS:\n${input.retryFeedback}` : ''}

Output the complete structured lyrics JSON.`
  );

  return unwrapAgentResult(result, 'LyricsAgent');
}

/**
 * Extract raw lyrics from structured lyrics.
 */
export function extractRawLyrics(structured: StructuredLyrics): string {
  return structured.rawLyrics;
}

/**
 * Estimate duration from sections.
 */
export function estimateDuration(sections: LyricsSection[]): number {
  return sections.reduce((total, s) => total + s.estimatedSeconds, 0);
}

/**
 * Count hook phrase occurrences in raw lyrics.
 */
export function countHookOccurrences(rawLyrics: string, hookPhrase: string): number {
  const regex = new RegExp(hookPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return (rawLyrics.match(regex) || []).length;
}
