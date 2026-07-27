/**
 * Context Gatherer v2
 *
 * Enhanced context gatherer that:
 * - Takes GenerationStrategy as input
 * - Outputs EnrichedContext (structured)
 * - Respects strategy constraints (vocabulary, objectives)
 *
 * Pattern: Sequential pipeline with typed contracts
 */

import type { GenerationStrategy, EnrichedContext } from '@/types';
import { EnrichedContextSchema } from '@/types';
import { callValidatedAgent, unwrapAgentResult } from '@/lib/validated-agent';
import { MODELS } from '@/lib/anthropic';

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

function buildContextGathererV2Prompt(strategy: GenerationStrategy): string {
  return `You are the CONTEXT GATHERER of KidLearnio.

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION: Extract educational context that aligns with the strategy.
═══════════════════════════════════════════════════════════════════════════════

You MUST respect the strategy constraints. The Strategist has already decided:
- Which vocabulary terms to use
- What learning objectives to cover
- The age-appropriate complexity

Your job is to find the CONTENT that fits these constraints.

═══════════════════════════════════════════════════════════════════════════════
STRATEGY CONSTRAINTS (from Strategist)
═══════════════════════════════════════════════════════════════════════════════

Topic: ${strategy.topic}
Language: ${strategy.language}
Age Range: ${strategy.ageRange[0]}-${strategy.ageRange[1]}

VOCABULARY ANCHORS (use ONLY these technical terms):
${strategy.vocabularyAnchors.map((v, i) => `  ${i + 1}. ${v}`).join('\n')}

LEARNING OBJECTIVES (context must support these):
${strategy.learningObjectives.map((o, i) => `  ${i + 1}. ${o}`).join('\n')}

AGE CONSTRAINTS:
- Vocabulary level: ${strategy.ageConstraints.vocabularyLevel}
- Abstraction allowed: ${strategy.ageConstraints.abstractionAllowed}
- Metaphor sources: ${strategy.ageConstraints.metaphorSources.join(', ')}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════

Extract:
1. CORE CONCEPTS (2-5): Fundamental ideas using the vocabulary anchors
2. KEY FACTS (2-5): Specific teachable facts
3. REAL WORLD CONNECTIONS (2-4): How this applies to a child's life
4. CURIOSITY TRIGGERS (2-4): What makes this interesting/surprising

RULES:
- Use ONLY vocabulary from vocabularyAnchors for technical terms
- Every concept must support at least one learning objective
- Keep language at ${strategy.ageConstraints.vocabularyLevel} level
- Use metaphors from: ${strategy.ageConstraints.metaphorSources.join(', ')}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return a JSON object:
{
  "coreConcepts": ["concept 1 using vocab anchors", ...],
  "keyFacts": ["fact 1", ...],
  "realWorldConnections": ["connection 1", ...],
  "curiosityTriggers": ["trigger 1", ...],
  "complexityNotes": "What might confuse children at this age",
  "vocabularyUsed": ["list of vocabulary anchors actually used"],
  "strategyId": "${strategy.id}"
}`;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Gather educational context bound by strategy.
 */
export async function gatherContextV2(strategy: GenerationStrategy): Promise<EnrichedContext> {
  const result = await callValidatedAgent(
    {
      name: 'ContextGatherer',
      schema: EnrichedContextSchema,
      systemPrompt: buildContextGathererV2Prompt(strategy),
      model: MODELS.CONTEXT_GATHERER, // Can use cheaper model
      maxTokens: 1024,
      temperature: 0.5,
      maxRetries: 2,
    },
    `Extract educational context for "${strategy.topic}" for ages ${strategy.ageRange[0]}-${strategy.ageRange[1]}.

Remember:
- Use ONLY these vocabulary terms: ${strategy.vocabularyAnchors.join(', ')}
- Support these learning objectives: ${strategy.learningObjectives.join('; ')}
- Keep complexity at: ${strategy.ageConstraints.vocabularyLevel}

Output the context JSON.`
  );

  return unwrapAgentResult(result, 'ContextGatherer');
}
