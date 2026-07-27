import { z } from 'zod';

// Import base types for internal use
import {
  SupportedLanguageSchema,
  type SupportedLanguage,
  AgeRangeSchema,
  TechniqueSchema,
} from './base';

// Re-export base types for external consumers
export {
  SupportedLanguageSchema,
  type SupportedLanguage,
  AgeRangeSchema,
  type AgeRange,
  TechniqueSchema,
  type Technique,
} from './base';

// ============================================================================
// LANGUAGE SCHEMAS — Brains Before Mouths
// ============================================================================

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  tr: 'Türkçe',
  zh: '中文',
};

export const LANGUAGE_BRAIN_PATHS: Record<SupportedLanguage, string> = {
  en: 'docs/languages/LYRICS_EN.md',
  tr: 'docs/languages/LYRICS_TR.md',
  zh: 'docs/languages/LYRICS_ZH.md',
};

/**
 * Language Brain — cognitive patterns for target language
 * Loaded from LYRICS_{LANG}.md before any generation
 */
export interface LanguageBrain {
  code: SupportedLanguage;
  name: string;

  // Cognitive patterns (how speakers THINK)
  cognitiveSemantics: {
    agentFocus: 'high' | 'medium' | 'low';
    topicProminent: boolean;
    evidentiality: boolean;
    spatialFraming: 'absolute' | 'relative' | 'intrinsic';
  };

  // Linguistic features
  features: {
    wordOrder: 'SOV' | 'SVO' | 'VSO' | 'flexible';
    agglutinative: boolean;
    tonal: boolean;
    stressPattern: 'fixed' | 'mobile' | 'pitch';
  };

  // Raw document content
  rawDocument: string;
}

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const OutputTypeSchema = z.enum(['lyrics', 'style', 'both']);

export const GenerationInputSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(200, 'Topic too long'),
  ageRange: AgeRangeSchema,
  technique: TechniqueSchema,
  language: SupportedLanguageSchema.default('en'),
  outputType: OutputTypeSchema.default('both'),
  customInstructions: z.string().max(500).optional(),
});

export type GenerationInput = z.infer<typeof GenerationInputSchema>;
export type OutputType = z.infer<typeof OutputTypeSchema>;

// ============================================================================
// PIPELINE SCHEMAS
// ============================================================================

export const PipelineStageSchema = z.enum([
  'IDLE',
  'GATHERING_CONTEXT',
  'APPLYING_TECHNIQUE',
  'GENERATING_FLOW_GUIDANCE', // Song Flow Expert stage
  'GENERATING_LYRICS',
  'GENERATING_STYLE',
  'STORING_MEMORY',
  'COMPLETE',
  'ERROR',
]);

export type PipelineStage = z.infer<typeof PipelineStageSchema>;

export const GatheredContextSchema = z.object({
  coreConcepts: z.array(z.string()),
  keyFacts: z.array(z.string()),
  realWorldConnections: z.array(z.string()),
  complexityNotes: z.string(),
  curiosityTriggers: z.array(z.string()),
  ageAdaptations: z.object({
    vocabularyLevel: z.enum(['concrete_only', 'introduce_technical', 'technical_with_context']),
    sentenceMax: z.number(),
    metaphorSources: z.array(z.string()),
    complexity: z.enum(['single_step', 'multi_step', 'abstract_ok']),
  }),
});

export type GatheredContext = z.infer<typeof GatheredContextSchema>;

export const PipelineStateSchema = z.object({
  stage: PipelineStageSchema,
  topic: z.string(),
  ageRange: AgeRangeSchema,
  technique: TechniqueSchema,
  context: GatheredContextSchema.optional(),
  lyrics: z.string().optional(),
  style: z.string().optional(),
  memoryId: z.string().optional(),
  error: z.string().optional(),
  startedAt: z.string(),
  updatedAt: z.string(),
});

export type PipelineState = z.infer<typeof PipelineStateSchema>;

// ============================================================================
// OUTPUT SCHEMAS
// ============================================================================

export const GenerationMetadataSchema = z.object({
  topic: z.string(),
  ageRange: AgeRangeSchema,
  technique: TechniqueSchema,
  language: SupportedLanguageSchema,
  sessionId: z.string(),
  timestamp: z.string(),
  durationMs: z.number(),
  traceId: z.string().optional(), // Link to dashboard trace
});

export type GenerationMetadata = z.infer<typeof GenerationMetadataSchema>;

export const GenerationOutputSchema = z.object({
  success: z.boolean(),
  lyrics: z.string().optional(),
  style: z.string().optional(),
  metadata: GenerationMetadataSchema,
  error: z.string().optional(),
});

export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;

// ============================================================================
// MEMORY SCHEMAS
// ============================================================================

export const SessionMemorySchema = z.object({
  sessionId: z.string(),
  topic: z.string(),
  ageRange: AgeRangeSchema,
  technique: TechniqueSchema,
  generatedLyrics: z.string(),
  generatedStyle: z.string(),
  timestamp: z.string(),
  feedback: z.object({
    rating: z.number().min(1).max(5),
    notes: z.string(),
  }).optional(),
});

export type SessionMemory = z.infer<typeof SessionMemorySchema>;

// ============================================================================
// AGENT DOCUMENT SCHEMAS
// ============================================================================

export interface AgentDocuments {
  curiosity: string;
  pedagogy: string;
  pipeline: string;
  logicSticks: string;
  sunoGuide: string;
  languageArchitecture: string;
}

export interface AgentDocumentsWithBrain extends AgentDocuments {
  languageBrain: LanguageBrain;
}

// ============================================================================
// UI STATE SCHEMAS
// ============================================================================

export const FormStateSchema = z.object({
  topic: z.string(),
  ageMin: z.number().min(5).max(18),
  ageMax: z.number().min(5).max(18),
  technique: TechniqueSchema,
  outputType: OutputTypeSchema,
  isLoading: z.boolean(),
  currentStage: PipelineStageSchema,
});

export type FormState = z.infer<typeof FormStateSchema>;

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const ApiFailureSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema,
});

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncResult<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// ============================================================================
// STRUCTURED PIPELINE TYPES (v2 Architecture)
// ============================================================================

export * from './strategy';
