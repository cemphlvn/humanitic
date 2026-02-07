import type { AgentDocuments, GatheredContext, AgeRange } from '@/types';
import { GatheredContextSchema } from '@/types';
import { createMessage, MODELS, TOKEN_LIMITS } from '@/lib/anthropic';

/**
 * Build the context gatherer system prompt.
 */
export function buildContextGathererPrompt(): string {
  return `You are the CONTEXT GATHERER of KidLearnio.
Your job is to break down educational topics into teachable components.

YOUR TASK:
Given a topic and age range, analyze and extract:

1. CORE CONCEPTS - The fundamental ideas that must be understood
2. KEY FACTS - Specific pieces of information to teach
3. REAL WORLD CONNECTIONS - How this applies to a child's life
4. COMPLEXITY NOTES - What might confuse children
5. CURIOSITY TRIGGERS - What makes this interesting/surprising

AGE ADAPTATIONS:
For ages 5-7:
  - vocabularyLevel: "concrete_only"
  - sentenceMax: 7
  - metaphorSources: ["animals", "toys", "family", "food"]
  - complexity: "single_step"

For ages 8-10:
  - vocabularyLevel: "introduce_technical"
  - sentenceMax: 10
  - metaphorSources: ["sports", "games", "nature", "technology"]
  - complexity: "multi_step"

For ages 11-14:
  - vocabularyLevel: "technical_with_context"
  - sentenceMax: 15
  - metaphorSources: ["social", "culture", "systems", "abstract"]
  - complexity: "abstract_ok"

OUTPUT FORMAT (JSON):
{
  "coreConcepts": ["concept 1", "concept 2", ...],
  "keyFacts": ["fact 1", "fact 2", ...],
  "realWorldConnections": ["connection 1", "connection 2", ...],
  "complexityNotes": "What might be confusing...",
  "curiosityTriggers": ["surprising fact 1", "question 1", ...],
  "ageAdaptations": {
    "vocabularyLevel": "concrete_only" | "introduce_technical" | "technical_with_context",
    "sentenceMax": number,
    "metaphorSources": ["source1", "source2", ...],
    "complexity": "single_step" | "multi_step" | "abstract_ok"
  }
}

IMPORTANT:
- Keep lists to 3-5 items each (focused, not exhaustive)
- Use age-appropriate language in your examples
- Focus on what's TEACHABLE through song
- Identify the most MEMORABLE aspects`;
}

/**
 * Gather educational context for a topic.
 */
export async function gatherContext(
  topic: string,
  ageRange: AgeRange
): Promise<GatheredContext> {
  const systemPrompt = buildContextGathererPrompt();

  const userMessage = `
Analyze this topic for educational song creation:

TOPIC: ${topic}
AGE RANGE: ${ageRange[0]}-${ageRange[1]} years old

Extract the context following the specified format.
Focus on what can be effectively taught through music.`;

  const response = await createMessage(systemPrompt, userMessage, {
    model: MODELS.CONTEXT_GATHERER,
    maxTokens: TOKEN_LIMITS.CONTEXT_GATHERER_OUTPUT,
    temperature: 0.5, // Lower for factual accuracy
  });

  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse context gatherer response');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    // Validate with Zod
    return GatheredContextSchema.parse(parsed);
  } catch (error) {
    console.error('Context parsing error:', error);
    // Return a minimal valid context as fallback
    return createFallbackContext(topic, ageRange);
  }
}

/**
 * Create a fallback context when parsing fails.
 */
function createFallbackContext(
  topic: string,
  ageRange: AgeRange
): GatheredContext {
  const isYoung = ageRange[0] <= 7;
  const isMiddle = ageRange[0] > 7 && ageRange[0] <= 10;

  return {
    coreConcepts: [`Understanding ${topic}`, `Why ${topic} matters`],
    keyFacts: [`Key fact about ${topic}`],
    realWorldConnections: [`How ${topic} affects daily life`],
    complexityNotes: 'Context gathering failed - using defaults',
    curiosityTriggers: [`What makes ${topic} interesting?`],
    ageAdaptations: {
      vocabularyLevel: isYoung
        ? 'concrete_only'
        : isMiddle
          ? 'introduce_technical'
          : 'technical_with_context',
      sentenceMax: isYoung ? 7 : isMiddle ? 10 : 15,
      metaphorSources: isYoung
        ? ['animals', 'toys', 'family', 'food']
        : isMiddle
          ? ['sports', 'games', 'nature', 'technology']
          : ['social', 'culture', 'systems', 'abstract'],
      complexity: isYoung
        ? 'single_step'
        : isMiddle
          ? 'multi_step'
          : 'abstract_ok',
    },
  };
}

/**
 * Enhance context with memory patterns (if available).
 */
export function enhanceContextWithPatterns(
  context: GatheredContext,
  memoryPatterns: Array<{
    technique: string;
    successfulTriggers: string[];
  }>
): GatheredContext {
  if (memoryPatterns.length === 0) {
    return context;
  }

  // Merge successful triggers from memory
  const additionalTriggers = memoryPatterns
    .flatMap((p) => p.successfulTriggers)
    .slice(0, 2); // Add up to 2 from memory

  return {
    ...context,
    curiosityTriggers: [
      ...context.curiosityTriggers,
      ...additionalTriggers,
    ].slice(0, 5), // Keep max 5
  };
}
