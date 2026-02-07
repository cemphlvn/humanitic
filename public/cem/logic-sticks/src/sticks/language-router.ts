/**
 * Language Router Stick
 *
 * Routes concept through correct language brain BEFORE generation.
 * MUST BE FIRST in any lyrics generation pipeline.
 * Vector: [cognition, localization, native_voice]
 */

import type {
  LogicStick,
  SupportedLanguage,
  LanguageCognitivePatterns,
  LanguageLinguisticFeatures,
} from '../types.js';

export interface LanguageRouterInput {
  targetLanguage: SupportedLanguage;
}

export interface LanguageRouterOutput {
  language: SupportedLanguage;
  languageName: string;
  cognitivePatterns: LanguageCognitivePatterns;
  linguisticFeatures: LanguageLinguisticFeatures;
  brainDocumentPath: string;
}

/**
 * Language names for display
 */
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  tr: 'Türkçe',
  zh: '中文',
};

/**
 * Cognitive patterns per language
 */
const COGNITIVE_PATTERNS: Record<SupportedLanguage, LanguageCognitivePatterns> = {
  en: {
    agentFocus: 'high',
    topicProminent: false,
    evidentiality: false,
    spatialFraming: 'relative',
  },
  tr: {
    agentFocus: 'medium',
    topicProminent: false,
    evidentiality: true, // -miş, -di markers
    spatialFraming: 'relative',
  },
  zh: {
    agentFocus: 'low',
    topicProminent: true,
    evidentiality: false,
    spatialFraming: 'relative',
  },
};

/**
 * Linguistic features per language
 */
const LINGUISTIC_FEATURES: Record<SupportedLanguage, LanguageLinguisticFeatures> = {
  en: {
    wordOrder: 'SVO',
    agglutinative: false,
    tonal: false,
    stressPattern: 'mobile',
  },
  tr: {
    wordOrder: 'SOV',
    agglutinative: true,
    tonal: false,
    stressPattern: 'fixed',
  },
  zh: {
    wordOrder: 'SVO',
    agglutinative: false,
    tonal: true,
    stressPattern: 'pitch',
  },
};

/**
 * Language Router Logic Stick
 *
 * ENFORCEMENT: This stick MUST execute before ANY lyric generation.
 * It loads the language brain and returns cognitive/linguistic parameters.
 */
export const languageRouter: LogicStick<LanguageRouterInput, LanguageRouterOutput> = {
  name: 'language_router',
  purpose: 'Route concept through correct language brain BEFORE generation',
  vector: ['cognition', 'localization', 'native_voice'] as const,
  consumers: ['@humanitic/kidlearnio'] as const,

  apply: (input: LanguageRouterInput): LanguageRouterOutput => {
    const { targetLanguage } = input;

    return {
      language: targetLanguage,
      languageName: LANGUAGE_NAMES[targetLanguage],
      cognitivePatterns: COGNITIVE_PATTERNS[targetLanguage],
      linguisticFeatures: LINGUISTIC_FEATURES[targetLanguage],
      // Consumer must load this document for full brain
      brainDocumentPath: `docs/languages/LYRICS_${targetLanguage.toUpperCase()}.md`,
    };
  },

  composition: {
    // Language router precedes ALL other sticks
    precedes: [
      'age_adapter',
      'curiosity_spark',
      'structure_scaffold',
      'connection_bridge',
      'memorability_booster',
      'vocabulary_gate',
      'rhyme_finder',
    ],
  },
};
