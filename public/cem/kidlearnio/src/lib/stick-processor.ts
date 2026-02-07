/**
 * Stick Processor
 *
 * Applies logic-sticks to pre-compute deterministic transformations
 * BEFORE expensive Claude API calls.
 *
 * Pattern: Sticks handle the predictable; Claude handles the creative.
 */

import {
  ageAdapter,
  languageRouter,
  structureScaffold,
  songOrder,
  songChoreography,
  curiositySpark,
  validateCompositionOrder,
  type AgeAdapterOutput,
  type LanguageRouterOutput,
  type StructureScaffoldOutput,
  type SongOrderOutput,
  type SongChoreographyOutput,
  type CuriositySparkOutput,
} from '@humanitic/logic-sticks';

import type { AgeRange, Technique, SupportedLanguage } from '@/types';

/**
 * Coordinator outputs from multi-orchestrator architecture
 */
export interface CoordinatorOutputs {
  curiosity?: {
    coordinatorGuidance: string;
    primaryHookType: string;
  };
  // Future coordinators: pedagogy, structure, language
}

/**
 * Complete pre-processing result from all applicable sticks
 */
export interface StickProcessorResult {
  ageAdaptation: AgeAdapterOutput;
  languageRouting: LanguageRouterOutput;
  structure: StructureScaffoldOutput;
  songOrder: SongOrderOutput;
  choreography: SongChoreographyOutput;
  curiosity: CuriositySparkOutput;

  // Coordinator outputs (multi-orchestrator)
  coordinators: CoordinatorOutputs;

  // Computed from sticks
  promptEnhancements: {
    vocabularyGuidance: string;
    structureGuidance: string;
    languageGuidance: string;
    singabilityGuidance: string;
    choreographyGuidance: string;
    curiosityGuidance: string;
  };
}

/**
 * Apply all relevant sticks for lyrics generation.
 *
 * COMPOSITION ORDER (from logic-sticks):
 * 1. language_router (MUST BE FIRST)
 * 2. age_adapter
 * 3. curiosity_spark (transforms facts into wonder)
 * 4. structure_scaffold
 * 5. song_order (enforces brevity/singability)
 * 6. song_choreography (movement patterns)
 */
export function processSticks(
  language: SupportedLanguage,
  ageRange: AgeRange,
  technique: Technique,
  topic?: string
): StickProcessorResult {
  // 1. Language Router — FIRST (determines cognitive patterns)
  const languageRouting = languageRouter.apply({ targetLanguage: language });

  // 2. Age Adapter — adjusts content for target age
  const ageAdaptation = ageAdapter.apply({ ageRange });

  // 3. Curiosity Spark — transforms facts into wonder triggers
  const curiosity = curiositySpark.apply({ ageRange, topic: topic || '' });

  // 4. Structure Scaffold — provides song structure for technique
  const structure = structureScaffold.apply({ technique });

  // 5. Song Order — enforces brevity and singability
  const songOrderResult = songOrder.apply({ ageRange, technique });

  // 6. Song Choreography — movement patterns for kinesthetic learning
  const choreography = songChoreography.apply({ ageRange, technique });

  // Compute prompt enhancements from stick outputs
  const promptEnhancements = computePromptEnhancements(
    ageAdaptation,
    languageRouting,
    structure,
    songOrderResult,
    choreography,
    curiosity
  );

  return {
    ageAdaptation,
    languageRouting,
    structure,
    songOrder: songOrderResult,
    choreography,
    curiosity,
    coordinators: {}, // Populated later by coordinators in pipeline
    promptEnhancements,
  };
}

/**
 * Merge coordinator outputs into stick results.
 * Called by pipeline after coordinators run.
 */
export function withCoordinatorOutputs(
  result: StickProcessorResult,
  coordinators: CoordinatorOutputs
): StickProcessorResult {
  return {
    ...result,
    coordinators,
  };
}

/**
 * Transform stick outputs into prompt-ready guidance.
 */
function computePromptEnhancements(
  age: AgeAdapterOutput,
  lang: LanguageRouterOutput,
  struct: StructureScaffoldOutput,
  order: SongOrderOutput,
  choreo: SongChoreographyOutput,
  curio: CuriositySparkOutput
): StickProcessorResult['promptEnhancements'] {
  // Vocabulary guidance from age adapter
  const vocabularyGuidance = `
VOCABULARY RULES (from age_adapter stick):
- Level: ${age.vocabularyLevel}
- Max sentence length: ${age.sentenceMax} words
- Metaphor sources: ${age.metaphorSources.join(', ')}
- Complexity: ${age.complexity}`.trim();

  // Structure guidance from structure scaffold
  const sectionList = struct.sections.join(' → ');
  const structureGuidance = `
SONG STRUCTURE (from structure_scaffold stick):
- Sections: ${sectionList}
- Chorus repeats: ${struct.chorusRepeats}x
- Verse complexity: ${struct.verseComplexity}
- Chorus purpose: ${struct.chorusPurpose}
- Bridge purpose: ${struct.bridgePurpose}`.trim();

  // Language guidance from language router
  const languageGuidance = `
LANGUAGE PATTERNS (from language_router stick):
- Target: ${lang.languageName} (${lang.language})
- Word order: ${lang.linguisticFeatures.wordOrder}
- Agent focus: ${lang.cognitivePatterns.agentFocus}
- Topic prominent: ${lang.cognitivePatterns.topicProminent ? 'yes' : 'no'}
- Evidentiality: ${lang.cognitivePatterns.evidentiality ? 'required' : 'optional'}
- Rhythm: ${lang.linguisticFeatures.stressPattern}
- Tonal: ${lang.linguisticFeatures.tonal ? 'yes' : 'no'}`.trim();

  // Singability guidance from song_order stick
  const singabilityGuidance = order.singabilityGuidance;

  // Choreography guidance from song_choreography stick
  const choreographyGuidance = choreo.choreographyGuidance;

  // Curiosity guidance from curiosity_spark stick
  const curiosityGuidance = curio.curiosityGuidance;

  return {
    vocabularyGuidance,
    structureGuidance,
    languageGuidance,
    singabilityGuidance,
    choreographyGuidance,
    curiosityGuidance,
  };
}

/**
 * Check if current stick composition is valid.
 */
export function validateStickComposition(stickNames: readonly string[]): {
  valid: boolean;
  errors: string[];
} {
  return validateCompositionOrder(stickNames);
}

/**
 * Get recommended sticks for a given output type.
 */
export function getRecommendedSticks(outputType: 'lyrics' | 'style' | 'both'): string[] {
  if (outputType === 'style') {
    return ['age_adapter', 'suno_style_composer'];
  }

  // Lyrics or both
  return [
    'language_router',
    'age_adapter',
    'curiosity_spark',
    'structure_scaffold',
    'song_order',
    'song_choreography',
    // Future sticks:
    // 'memorability_booster',
    // 'vocabulary_gate',
    // 'rhyme_finder',
  ];
}
