/**
 * Curiosity Spark Stick
 *
 * Transforms facts into curiosity triggers that spark wonder.
 * Patterns defined in docs/CURIOSITY_PATTERNS.md (editable by educators).
 * Vector: [wonder, engagement, motivation]
 */

import type { LogicStick, AgeRange } from '../types.js';

export interface CuriositySparkInput {
  ageRange: AgeRange;
  topic: string;
}

export interface CuriositySparkOutput {
  // Recommended trigger types for this age
  recommendedTriggers: TriggerType[];

  // Patterns to use
  patterns: CuriosityPattern[];

  // Things to avoid
  curiosityKillers: string[];

  // Sustainers for keeping curiosity alive
  sustainers: string[];

  // Guidance for prompt
  curiosityGuidance: string;
}

export type TriggerType =
  | 'mystery_box'
  | 'surprise_reveal'
  | 'personal_connection'
  | 'contradiction_hook'
  | 'scale_shock';

export interface CuriosityPattern {
  type: TriggerType;
  template: string;
  example: string;
}

/**
 * Curiosity Spark Logic Stick
 *
 * GIVEN age_range and topic
 * RETURN curiosity patterns and triggers appropriate for the audience
 */
export const curiositySpark: LogicStick<CuriositySparkInput, CuriositySparkOutput> = {
  name: 'curiosity_spark',
  purpose: 'Transform facts into wonder-sparking questions',
  vector: ['wonder', 'engagement', 'motivation'] as const,
  consumers: ['@humanitic/kidlearnio'] as const,

  apply: (input: CuriositySparkInput): CuriositySparkOutput => {
    const [minAge] = input.ageRange;

    const recommendedTriggers = getTriggersForAge(minAge);
    const patterns = getPatternsForTriggers(recommendedTriggers);
    const curiosityKillers = getCuriosityKillers();
    const sustainers = getSustainers();

    return {
      recommendedTriggers,
      patterns,
      curiosityKillers,
      sustainers,
      curiosityGuidance: buildCuriosityGuidance(recommendedTriggers, patterns, minAge),
    };
  },

  composition: {
    composesWith: ['age_adapter', 'language_router'],
    precedes: ['structure_scaffold', 'memorability_booster'],
  },
};

function getTriggersForAge(minAge: number): TriggerType[] {
  if (minAge <= 7) {
    // Ages 5-7: Concrete, immediate, personal
    return ['mystery_box', 'personal_connection'];
  }
  if (minAge <= 10) {
    // Ages 8-10: Can handle surprises and scale
    return ['surprise_reveal', 'scale_shock', 'personal_connection'];
  }
  // Ages 11-14: Can handle contradictions and abstract
  return ['contradiction_hook', 'surprise_reveal', 'scale_shock'];
}

function getPatternsForTriggers(triggers: TriggerType[]): CuriosityPattern[] {
  const allPatterns: Record<TriggerType, CuriosityPattern> = {
    mystery_box: {
      type: 'mystery_box',
      template: 'Turn the fact into a puzzle: "Where does X go?" or "Why does X happen?"',
      example: '"Where does the puddle disappear to?" instead of "Water evaporates"',
    },
    surprise_reveal: {
      type: 'surprise_reveal',
      template: 'Lead with unexpected: "Did you know...", "What if I told you..."',
      example: '"Did you know you\'re drinking dinosaur water?"',
    },
    personal_connection: {
      type: 'personal_connection',
      template: 'Make it about THEM: "Right now, your body is...", "You are..."',
      example: '"You\'re spinning at 1,000 mph right now!"',
    },
    contradiction_hook: {
      type: 'contradiction_hook',
      template: 'Present seeming impossibility: "X happens, but Y also happens"',
      example: '"Heavy ships float, but tiny pebbles sink — how?"',
    },
    scale_shock: {
      type: 'scale_shock',
      template: 'Use extreme numbers or comparisons',
      example: '"One million Earths fit inside the sun"',
    },
  };

  return triggers.map(t => allPatterns[t]);
}

function getCuriosityKillers(): string[] {
  return [
    'Starting with "Today we\'ll learn about X" — no mystery',
    'Saying "X is important because" — tells instead of shows',
    'Using "Memorize these facts" — removes agency',
    'Saying "This is complicated but..." — creates fear',
  ];
}

function getSustainers(): string[] {
  return [
    'Breadcrumbs — Reveal partial answers that lead to new questions',
    'Callbacks — Reference earlier mysteries in the song',
    'Cliffhangers — End verses with new questions',
    'Ownership — "Now YOU know the secret!"',
  ];
}

function buildCuriosityGuidance(
  triggers: TriggerType[],
  patterns: CuriosityPattern[],
  minAge: number
): string {
  const triggerList = triggers.join(', ');
  const patternExamples = patterns.map(p => `- ${p.type}: ${p.example}`).join('\n');

  return `
CURIOSITY PATTERNS (from curiosity_spark stick):

RECOMMENDED TRIGGERS FOR AGE ${minAge}+:
${triggerList}

PATTERN EXAMPLES:
${patternExamples}

HOOK REQUIREMENTS:
- Open with a mystery, question, or surprise — NOT a statement
- Make it personal ("you", "your") when possible
- Use one of the trigger patterns above

AVOID (Curiosity Killers):
- "Today we'll learn about..."
- "X is important because..."
- Starting with definitions

SUSTAIN CURIOSITY:
- End verses with questions
- Use callbacks: "Remember when we asked...?"
- Final reveal: "Now YOU know the secret!"
`.trim();
}
