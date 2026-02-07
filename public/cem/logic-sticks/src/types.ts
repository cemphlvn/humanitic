/**
 * Logic Sticks Type Definitions
 *
 * These types define the structure of reasoning patterns
 * that can be composed into agent behaviors.
 */

// ============================================================================
// CORE STICK TYPES
// ============================================================================

/**
 * A Logic Stick — atomic reasoning pattern in conceptual space
 */
export interface LogicStick<TInput = unknown, TOutput = unknown> {
  /** Unique identifier for the stick */
  name: string;

  /** Single sentence describing purpose */
  purpose: string;

  /** Conceptual direction vector */
  vector: readonly string[];

  /** Which instances consume this stick */
  consumers: readonly string[];

  /** Execute the stick's logic */
  apply: (input: TInput) => TOutput;

  /** Composition relationships */
  composition: {
    /** Sticks this composes with */
    composesWith?: readonly string[];
    /** Sticks that compose this */
    composedBy?: readonly string[];
    /** Must come before these sticks */
    precedes?: readonly string[];
  };
}

/**
 * Stick application result
 */
export interface StickResult<T = unknown> {
  success: boolean;
  output: T;
  stickName: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// DOMAIN-SPECIFIC TYPES
// ============================================================================

/**
 * Age range tuple [min, max]
 */
export type AgeRange = readonly [number, number];

/**
 * Age adaptation parameters
 */
export interface AgeAdaptation {
  vocabularyLevel: 'concrete_only' | 'introduce_technical' | 'technical_with_context';
  sentenceMax: number;
  metaphorSources: readonly string[];
  complexity: 'single_step' | 'multi_step' | 'abstract_ok';
}

/**
 * Learning technique
 */
export type Technique = 'memorization' | 'connection';

/**
 * Supported languages for language_router
 */
export type SupportedLanguage = 'en' | 'tr' | 'zh';

/**
 * Language brain cognitive patterns
 */
export interface LanguageCognitivePatterns {
  agentFocus: 'high' | 'medium' | 'low';
  topicProminent: boolean;
  evidentiality: boolean;
  spatialFraming: 'absolute' | 'relative' | 'intrinsic';
}

/**
 * Language linguistic features
 */
export interface LanguageLinguisticFeatures {
  wordOrder: 'SOV' | 'SVO' | 'VSO' | 'flexible';
  agglutinative: boolean;
  tonal: boolean;
  stressPattern: 'fixed' | 'mobile' | 'pitch';
}

/**
 * Structure scaffold output
 */
export interface StructureScaffold {
  sections: readonly string[];
  chorusRepeats: number;
  verseComplexity: 'low' | 'building';
  chorusPurpose: string;
  bridgePurpose: string;
}

// ============================================================================
// COMPOSITION TYPES
// ============================================================================

/**
 * Stick composition ordering
 */
export interface CompositionOrder {
  sticks: readonly string[];
  enforced: boolean;
  description: string;
}

/**
 * Conflict resolution priority
 */
export type ConflictPriority = 'safety' | 'accuracy' | 'memorability' | 'style';

/**
 * Composition conflict resolution
 */
export interface ConflictResolution {
  priority: readonly ConflictPriority[];
  example?: {
    situation: string;
    resolution: string;
  };
}

// ============================================================================
// VECTOR SPACE TYPES
// ============================================================================

/**
 * Vector direction categories
 */
export type VectorCategory =
  | 'engagement'
  | 'accessibility'
  | 'retention'
  | 'scaffolding'
  | 'localization';

/**
 * Harmony measurement
 */
export interface HarmonyMeasurement {
  coherence: number; // 0-1
  effectiveness: number; // 0-1
  alignment: number; // 0-1
}

/**
 * Vector space operation
 */
export type VectorOperation = 'chain' | 'merge' | 'branch';

// ============================================================================
// CO-BUILDING TYPES
// ============================================================================

/**
 * Consumer instance registration
 */
export interface ConsumerInstance {
  name: string;
  uses: readonly string[];
  contributes: string;
}

/**
 * Stick contribution template
 */
export interface StickContribution {
  name: string;
  purpose: string;
  vector: readonly string[];
  logic: string;
  composition: LogicStick['composition'];
  consumers: readonly string[];
}
