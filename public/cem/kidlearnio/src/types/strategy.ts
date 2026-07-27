import { z } from 'zod';
import { AgeRangeSchema, TechniqueSchema, SupportedLanguageSchema } from './base';

// ============================================================================
// GENERATION STRATEGY — Single Source of Truth
// ============================================================================

/**
 * Emotional arc patterns for educational songs.
 * Determines the journey from start to finish.
 */
export const EmotionalArcSchema = z.enum([
  'curiosity_to_mastery',      // Wonder → Learning → "I got this!"
  'mystery_to_revelation',     // Question → Exploration → "Aha!"
  'play_to_understanding',     // Fun → Engagement → Deep learning
]);

export type EmotionalArc = z.infer<typeof EmotionalArcSchema>;

/**
 * Age-derived constraints computed once by Strategist.
 */
export const AgeConstraintsSchema = z.object({
  maxSyllablesPerLine: z.number().min(5).max(15),
  maxWordsPerSentence: z.number().min(5).max(15),
  vocabularyLevel: z.enum(['concrete_only', 'introduce_technical', 'technical_with_context']),
  abstractionAllowed: z.boolean(),
  metaphorSources: z.array(z.string()),
});

export type AgeConstraints = z.infer<typeof AgeConstraintsSchema>;

/**
 * GenerationStrategy — The contract that binds all agents.
 * Created by Strategist, consumed by all downstream agents.
 */
export const GenerationStrategySchema = z.object({
  // === Identity ===
  id: z.string().uuid(),
  topic: z.string(),
  language: SupportedLanguageSchema,
  technique: TechniqueSchema,
  ageRange: AgeRangeSchema,

  // === Consistency Anchors (MUST be respected by all agents) ===
  hookPhrase: z.string().min(3).max(30).describe('3-5 syllable phrase, determined upfront'),
  vocabularyAnchors: z.array(z.string()).min(3).max(5).describe('Key terms to repeat throughout'),
  emotionalArc: EmotionalArcSchema,

  // === Hard Constraints ===
  maxDurationSeconds: z.union([z.literal(60), z.literal(75), z.literal(90)]),
  maxSections: z.union([z.literal(4), z.literal(5)]),
  targetHookRepetitions: z.union([z.literal(3), z.literal(4), z.literal(5)]),

  // === Learning Contract ===
  learningObjectives: z.array(z.string()).min(1).max(3).describe('What child MUST learn'),
  successCriteria: z.array(z.string()).min(1).max(3).describe('How to verify learning'),

  // === Age Constraints (computed once) ===
  ageConstraints: AgeConstraintsSchema,

  // === Strategist Reasoning (for observability) ===
  reasoning: z.string().describe('Why these choices were made'),
});

export type GenerationStrategy = z.infer<typeof GenerationStrategySchema>;

// ============================================================================
// ENRICHED CONTEXT — Context Gatherer Output
// ============================================================================

/**
 * EnrichedContext — Context Gatherer output, bound by strategy.
 */
export const EnrichedContextSchema = z.object({
  // Bounded by strategy.vocabularyAnchors
  coreConcepts: z.array(z.string()).min(2).max(5),
  keyFacts: z.array(z.string()).min(2).max(5),
  realWorldConnections: z.array(z.string()).min(2).max(4),
  curiosityTriggers: z.array(z.string()).min(2).max(4),

  // Must align with strategy
  complexityNotes: z.string(),
  vocabularyUsed: z.array(z.string()).describe('Subset of strategy.vocabularyAnchors'),

  // Validation metadata
  strategyId: z.string().uuid().describe('Links back to GenerationStrategy'),
});

export type EnrichedContext = z.infer<typeof EnrichedContextSchema>;

// ============================================================================
// STRUCTURED LYRICS — Lyrics Agent Output
// ============================================================================

/**
 * Section types in a song.
 */
export const SectionTypeSchema = z.enum(['hook', 'verse', 'chorus', 'bridge', 'outro']);

export type SectionType = z.infer<typeof SectionTypeSchema>;

/**
 * A single section of the song.
 */
export const LyricsSectionSchema = z.object({
  type: SectionTypeSchema,
  lines: z.array(z.string()).min(1).max(6),
  choreography: z.array(z.string()).optional().describe('[clap], [stomp], etc.'),
  estimatedSeconds: z.number().min(5).max(30),
});

export type LyricsSection = z.infer<typeof LyricsSectionSchema>;

/**
 * StructuredLyrics — Lyrics Agent output with enforced constraints.
 */
export const StructuredLyricsSchema = z.object({
  // Must match strategy
  hookPhrase: z.string().describe('MUST match strategy.hookPhrase'),
  strategyId: z.string().uuid(),

  // Bounded sections
  sections: z.array(LyricsSectionSchema).min(3).max(5),

  // Computed metadata for validation
  estimatedDurationSeconds: z.number().min(30).max(120),
  hookRepetitionCount: z.number().min(1),
  vocabularyUsed: z.array(z.string()),
  learningObjectivesCovered: z.array(z.string()),

  // Raw lyrics for display
  rawLyrics: z.string().describe('Formatted lyrics with section markers'),
});

export type StructuredLyrics = z.infer<typeof StructuredLyricsSchema>;

// ============================================================================
// CRITIC VERDICT — Reflection Agent Output
// ============================================================================

/**
 * Issue severity levels.
 */
export const IssueSeveritySchema = z.enum(['error', 'warning', 'suggestion']);

/**
 * A single issue found by the Critic.
 */
export const CriticIssueSchema = z.object({
  severity: IssueSeveritySchema,
  category: z.enum([
    'hook_placement',
    'vocabulary_mismatch',
    'learning_objective_missing',
    'duration_exceeded',
    'section_limit_exceeded',
    'age_inappropriate',
    'singability',
  ]),
  message: z.string(),
  suggestion: z.string().optional(),
});

export type CriticIssue = z.infer<typeof CriticIssueSchema>;

/**
 * CriticVerdict — Pass/fail with detailed feedback.
 */
export const CriticVerdictSchema = z.object({
  pass: z.boolean(),
  score: z.number().min(0).max(100).describe('Quality score'),
  issues: z.array(CriticIssueSchema),

  // Specific checks
  hookInFirst15Seconds: z.boolean(),
  allVocabularyAnchorsUsed: z.boolean(),
  allLearningObjectivesCovered: z.boolean(),
  durationWithinLimit: z.boolean(),

  // For retry
  feedbackForRetry: z.string().optional().describe('Specific feedback if pass=false'),

  // Metadata
  strategyId: z.string().uuid(),
  attemptNumber: z.number().min(1).max(3),
});

export type CriticVerdict = z.infer<typeof CriticVerdictSchema>;

// ============================================================================
// STRUCTURED STYLE — Style Agent Output
// ============================================================================

export const StructuredStyleSchema = z.object({
  genre: z.string(),
  tempo: z.string(),
  instruments: z.array(z.string()),
  vocalStyle: z.string(),
  mood: z.string(),

  // Raw prompt for Suno
  rawStylePrompt: z.string(),

  // Metadata
  strategyId: z.string().uuid(),
});

export type StructuredStyle = z.infer<typeof StructuredStyleSchema>;

// ============================================================================
// PIPELINE STATE — Full typed state
// ============================================================================

export const PipelineStateV2Schema = z.object({
  strategy: GenerationStrategySchema.optional(),
  context: EnrichedContextSchema.optional(),
  lyrics: StructuredLyricsSchema.optional(),
  criticVerdict: CriticVerdictSchema.optional(),
  style: StructuredStyleSchema.optional(),

  // Retry tracking
  lyricsAttempts: z.number().default(0),
  lastError: z.string().optional(),
});

export type PipelineStateV2 = z.infer<typeof PipelineStateV2Schema>;
