/**
 * Strategist Agent
 *
 * The FIRST agent in the pipeline. Creates the GenerationStrategy
 * which is the single source of truth for all downstream agents.
 *
 * Pattern: Plan-and-Execute (capable model creates strategy)
 * Source: https://www.vellum.ai/blog/agentic-workflows-emerging-architectures-and-design-patterns
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  GenerationStrategy,
  AgeRange,
  Technique,
  SupportedLanguage,
  AgeConstraints,
  EmotionalArc,
} from '@/types';
import { GenerationStrategySchema } from '@/types';
import { callValidatedAgent, unwrapAgentResult } from '@/lib/validated-agent';
import { MODELS } from '@/lib/anthropic';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface StrategistInput {
  topic: string;
  ageRange: AgeRange;
  technique: Technique;
  language: SupportedLanguage;
  customInstructions?: string;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

function buildStrategistPrompt(input: StrategistInput): string {
  const ageConstraints = computeAgeConstraints(input.ageRange);

  return `You are the STRATEGIST of KidLearnio.

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION: Create the MASTER PLAN for this educational song.
═══════════════════════════════════════════════════════════════════════════════

You define the SINGLE SOURCE OF TRUTH that ALL other agents MUST follow:
- The hook phrase (catchy, 3-5 syllables)
- The vocabulary anchors (max 5 key terms)
- The learning objectives (max 3, specific and measurable)
- The emotional arc of the song
- Hard constraints (duration, sections, repetitions)

Your strategy is a CONTRACT. Downstream agents cannot deviate.

═══════════════════════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════════════════════

TOPIC: ${input.topic}
LANGUAGE: ${input.language}
TECHNIQUE: ${input.technique}
AGE RANGE: ${input.ageRange[0]}-${input.ageRange[1]} years old

PRE-COMPUTED AGE CONSTRAINTS:
- Max syllables/line: ${ageConstraints.maxSyllablesPerLine}
- Max words/sentence: ${ageConstraints.maxWordsPerSentence}
- Vocabulary level: ${ageConstraints.vocabularyLevel}
- Abstraction allowed: ${ageConstraints.abstractionAllowed}
- Metaphor sources: ${ageConstraints.metaphorSources.join(', ')}

${input.customInstructions ? `CUSTOM INSTRUCTIONS: ${input.customInstructions}` : ''}

═══════════════════════════════════════════════════════════════════════════════
STRATEGY RULES
═══════════════════════════════════════════════════════════════════════════════

HOOK PHRASE:
- Must be 3-5 syllables
- Must be catchy and repeatable
- Must relate to the core concept
- Examples: "Pho-to-syn-the-sis!", "Mul-ti-ply!", "Wa-ter cy-cle!"

VOCABULARY ANCHORS (exactly 3-5 terms):
- These are the ONLY technical terms allowed in the song
- Choose the most essential terms for the topic
- All must be age-appropriate for ${input.ageRange[0]}-${input.ageRange[1]}

LEARNING OBJECTIVES (exactly 1-3):
- Start with "The child will..."
- Must be specific and verifiable
- Example: "The child will recall that plants make food from sunlight"

EMOTIONAL ARC:
- curiosity_to_mastery: Wonder → Learning → "I got this!" (best for memorization)
- mystery_to_revelation: Question → Exploration → "Aha!" (best for connection/processes)
- play_to_understanding: Fun → Engagement → Deep learning (best for younger children)

DURATION (choose based on age and complexity):
- 60 seconds: Ages 5-7, simple topics
- 75 seconds: Ages 8-10, moderate complexity
- 90 seconds: Ages 11-14, complex topics

SECTIONS (choose 4 or 5):
- 4 sections: Hook + Verse + Chorus + Bridge (younger/simpler)
- 5 sections: Hook + Verse + Chorus + Verse + Bridge (older/complex)

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY a JSON object matching this schema:
{
  "id": "uuid",
  "topic": "${input.topic}",
  "language": "${input.language}",
  "technique": "${input.technique}",
  "ageRange": [${input.ageRange[0]}, ${input.ageRange[1]}],
  "hookPhrase": "string (3-5 syllables)",
  "vocabularyAnchors": ["term1", "term2", "term3", ...],
  "emotionalArc": "curiosity_to_mastery" | "mystery_to_revelation" | "play_to_understanding",
  "maxDurationSeconds": 60 | 75 | 90,
  "maxSections": 4 | 5,
  "targetHookRepetitions": 3 | 4 | 5,
  "learningObjectives": ["The child will...", ...],
  "successCriteria": ["The child can...", ...],
  "ageConstraints": ${JSON.stringify(ageConstraints)},
  "reasoning": "Why you made these strategic choices"
}`;
}

// ============================================================================
// AGE CONSTRAINTS COMPUTATION (deterministic)
// ============================================================================

function computeAgeConstraints(ageRange: AgeRange): AgeConstraints {
  const avgAge = (ageRange[0] + ageRange[1]) / 2;

  if (avgAge <= 7) {
    return {
      maxSyllablesPerLine: 8,
      maxWordsPerSentence: 7,
      vocabularyLevel: 'concrete_only',
      abstractionAllowed: false,
      metaphorSources: ['animals', 'toys', 'family', 'food'],
    };
  }

  if (avgAge <= 10) {
    return {
      maxSyllablesPerLine: 10,
      maxWordsPerSentence: 10,
      vocabularyLevel: 'introduce_technical',
      abstractionAllowed: false,
      metaphorSources: ['sports', 'games', 'nature', 'technology'],
    };
  }

  return {
    maxSyllablesPerLine: 12,
    maxWordsPerSentence: 15,
    vocabularyLevel: 'technical_with_context',
    abstractionAllowed: true,
    metaphorSources: ['social', 'culture', 'systems', 'abstract'],
  };
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Create the generation strategy.
 * This is the FIRST step in the pipeline.
 */
export async function createStrategy(input: StrategistInput): Promise<GenerationStrategy> {
  const strategyId = uuidv4();

  const result = await callValidatedAgent(
    {
      name: 'Strategist',
      schema: GenerationStrategySchema,
      systemPrompt: buildStrategistPrompt(input),
      model: MODELS.ORCHESTRATOR, // Use smart model for strategy
      maxTokens: 1024,
      temperature: 0.4, // Lower for consistent strategic decisions
      maxRetries: 2,
    },
    `Create the generation strategy for topic "${input.topic}" for ages ${input.ageRange[0]}-${input.ageRange[1]}.

Think carefully about:
1. What is the MOST catchy hook phrase for this topic?
2. What are the ESSENTIAL vocabulary terms (max 5)?
3. What should the child ACTUALLY learn?
4. What emotional journey makes sense?

Then output the complete strategy JSON.`
  );

  const strategy = unwrapAgentResult(result, 'Strategist');

  // Ensure the ID is set (in case LLM generates a different one)
  return {
    ...strategy,
    id: strategyId,
  };
}

/**
 * Validate that a strategy is well-formed.
 * Can be used for additional business logic validation.
 */
export function validateStrategy(strategy: GenerationStrategy): string[] {
  const issues: string[] = [];

  // Check hook phrase syllable count (approximate)
  const syllableCount = countSyllables(strategy.hookPhrase);
  if (syllableCount < 3 || syllableCount > 7) {
    issues.push(`Hook phrase "${strategy.hookPhrase}" has ~${syllableCount} syllables (target: 3-5)`);
  }

  // Check vocabulary anchors count
  if (strategy.vocabularyAnchors.length < 3) {
    issues.push(`Only ${strategy.vocabularyAnchors.length} vocabulary anchors (need at least 3)`);
  }

  // Check learning objectives
  if (strategy.learningObjectives.length === 0) {
    issues.push('No learning objectives defined');
  }

  // Check consistency between technique and emotional arc
  if (strategy.technique === 'memorization' && strategy.emotionalArc === 'mystery_to_revelation') {
    issues.push('mystery_to_revelation arc is better suited for connection technique');
  }

  return issues;
}

/**
 * Approximate syllable count for English words.
 */
function countSyllables(text: string): number {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  let total = 0;

  for (const word of words) {
    if (word.length <= 3) {
      total += 1;
    } else {
      // Count vowel groups
      const vowelGroups = word.match(/[aeiouy]+/g) || [];
      total += Math.max(1, vowelGroups.length);
    }
  }

  return total;
}

/**
 * Get emotional arc description for prompts.
 */
export function describeEmotionalArc(arc: EmotionalArc): string {
  switch (arc) {
    case 'curiosity_to_mastery':
      return 'Start with wonder ("Did you know...?"), build learning, end with confidence ("Now I know!")';
    case 'mystery_to_revelation':
      return 'Start with a question ("What if...?"), explore possibilities, reveal the answer';
    case 'play_to_understanding':
      return 'Start playful and fun, engage through activity, land on understanding';
  }
}
