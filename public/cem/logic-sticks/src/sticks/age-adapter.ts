/**
 * Age Adapter Stick
 *
 * Adjusts any content for target age range.
 * Vector: [development, accessibility, appropriateness]
 */

import type { LogicStick, AgeRange, AgeAdaptation } from '../types.js';

export interface AgeAdapterInput {
  ageRange: AgeRange;
}

export interface AgeAdapterOutput extends AgeAdaptation {}

/**
 * Age Adapter Logic Stick
 *
 * GIVEN age_range [min, max]
 * RETURN age-appropriate parameters for content generation
 */
export const ageAdapter: LogicStick<AgeAdapterInput, AgeAdapterOutput> = {
  name: 'age_adapter',
  purpose: 'Adjust any content for target age range',
  vector: ['development', 'accessibility', 'appropriateness'] as const,
  consumers: ['@humanitic/kidlearnio'] as const,

  apply: (input: AgeAdapterInput): AgeAdapterOutput => {
    const [min] = input.ageRange;

    if (min <= 7) {
      return {
        vocabularyLevel: 'concrete_only',
        sentenceMax: 7,
        metaphorSources: ['animals', 'toys', 'family', 'food'] as const,
        complexity: 'single_step',
      };
    }

    if (min <= 10) {
      return {
        vocabularyLevel: 'introduce_technical',
        sentenceMax: 10,
        metaphorSources: ['sports', 'games', 'nature', 'technology'] as const,
        complexity: 'multi_step',
      };
    }

    return {
      vocabularyLevel: 'technical_with_context',
      sentenceMax: 15,
      metaphorSources: ['social', 'culture', 'systems', 'abstract'] as const,
      complexity: 'abstract_ok',
    };
  },

  composition: {
    composesWith: ['vocabulary_gate', 'connection_bridge'],
    composedBy: ['structure_scaffold'],
  },
};
