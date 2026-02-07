/**
 * Logic Sticks Integration
 *
 * Demonstrates co-building: kidlearnio consumes @humanitic/logic-sticks
 * and contributes educational domain refinements.
 *
 * Pattern: Import substrate, extend for domain
 */

import {
  // Sticks
  ageAdapter,
  languageRouter,
  structureScaffold,

  // Types
  type AgeRange as LogicSticksAgeRange,
  type SupportedLanguage as LogicSticksSupportedLanguage,
  type Technique as LogicSticksTechnique,

  // Composition utilities
  LYRICS_COMPOSITION_ORDER,
  STYLE_COMPOSITION_ORDER,
  validateCompositionOrder,
  composeSticks,

  // Document paths
  getDocumentPath,
} from '@humanitic/logic-sticks';

// Re-export for use across kidlearnio
export {
  ageAdapter,
  languageRouter,
  structureScaffold,
  LYRICS_COMPOSITION_ORDER,
  STYLE_COMPOSITION_ORDER,
  validateCompositionOrder,
  composeSticks,
  getDocumentPath,
};

// Type compatibility bridge — kidlearnio uses Zod, logic-sticks uses TS
export type LogicSticksTypes = {
  AgeRange: LogicSticksAgeRange;
  SupportedLanguage: LogicSticksSupportedLanguage;
  Technique: LogicSticksTechnique;
};

/**
 * Apply age adapter stick to educational content
 */
export function applyAgeAdaptation(ageRange: [number, number]) {
  return ageAdapter.apply({ ageRange });
}

/**
 * Route through language brain before generation
 */
export function routeLanguage(targetLanguage: LogicSticksSupportedLanguage) {
  return languageRouter.apply({ targetLanguage });
}

/**
 * Get structure scaffold for technique
 */
export function getStructure(technique: LogicSticksTechnique) {
  return structureScaffold.apply({ technique });
}

/**
 * Co-building contribution point:
 * KidLearnio extends logic-sticks with educational domain patterns
 *
 * Future: These insights feed back into logic-sticks as new sticks
 */
export const KIDLEARNIO_INSIGHTS = {
  // Observed patterns from usage that could become new sticks
  pending_sticks: [
    'curiosity_spark',      // Transforms facts into questions
    'memorability_booster', // Adds hooks, repetition, rhythm
    'vocabulary_gate',      // Age-appropriate word filtering
    'rhyme_finder',         // Language-specific rhyme patterns
  ],

  // Domain refinements to existing sticks
  refinements: {
    age_adapter: {
      observation: 'Ages 5-7 need more visual/kinesthetic metaphors',
      suggestion: 'Add metaphorDensity output to age_adapter',
    },
    language_router: {
      observation: 'Each language has unique pedagogical traditions',
      suggestion: 'Add pedagogicalTradition to language output',
    },
  },
} as const;
