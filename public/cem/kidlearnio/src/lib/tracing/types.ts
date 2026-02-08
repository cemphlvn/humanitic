/**
 * KidLearnio Trace Model
 *
 * Based on Langfuse patterns adapted for educational song generation.
 * Provides full observability into the agent pipeline.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type ObservationType =
  | 'pipeline'      // Root trace for entire generation
  | 'agent'         // Claude-powered agent (lyrics, style, flow)
  | 'coordinator'   // Hybrid scriptic+agentic (curiosity, flow)
  | 'tool'          // Deterministic operations (validation, sticks)
  | 'generation'    // LLM call with token tracking
  | 'evaluator'     // Quality checks (syllable validation)
  | 'guardrail';    // Safety/constraint enforcement

export type ObservationStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'error';

export type ObservationLevel =
  | 'DEBUG'
  | 'INFO'
  | 'WARNING'
  | 'ERROR';

// ============================================================================
// OBSERVATION (SPAN) MODEL
// ============================================================================

export interface Observation {
  // Identity
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  type: ObservationType;

  // Timing
  startTime: string;      // ISO timestamp
  endTime?: string;
  durationMs?: number;

  // Status
  status: ObservationStatus;
  level: ObservationLevel;
  statusMessage?: string;

  // I/O Capture (the critical missing piece)
  input?: unknown;
  output?: unknown;

  // Token Usage (per-observation)
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    model?: string;
    costUsd?: number;
  };

  // Metadata
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// ============================================================================
// TRACE (ROOT) MODEL
// ============================================================================

export interface Trace {
  // Identity
  id: string;
  sessionId?: string;     // Group multiple generations
  name: string;

  // Request Context
  input: {
    topic: string;
    language: string;
    ageRange: [number, number];
    technique: 'memorization' | 'connection';
  };

  // Final Output
  output?: {
    lyrics?: string;
    style?: string;
    success: boolean;
    error?: string;
  };

  // Timing
  startTime: string;
  endTime?: string;
  durationMs?: number;

  // Aggregated Metrics
  metrics: {
    totalTokens: number;
    totalCostUsd: number;
    agentCount: number;
    errorCount: number;
  };

  // All observations (flattened for easy query)
  observations: Observation[];

  // User/Session
  userId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// AGENT-SPECIFIC OBSERVATION TYPES
// ============================================================================

export interface AgentObservation extends Observation {
  type: 'agent' | 'coordinator';
  agentName: string;
  model?: string;
  prompt?: {
    system: string;
    user: string;
  };
}

export interface GenerationObservation extends Observation {
  type: 'generation';
  model: string;
  modelParameters?: {
    temperature?: number;
    maxTokens?: number;
  };
  usage: NonNullable<Observation['usage']>;
}

export interface EvaluatorObservation extends Observation {
  type: 'evaluator';
  evaluatorName: string;
  score?: number;
  passed?: boolean;
  details?: {
    metric: string;
    threshold?: number;
    actual?: number;
  };
}

export interface ToolObservation extends Observation {
  type: 'tool';
  toolName: string;
  // For validation tools
  validation?: {
    isValid: boolean;
    issues: Array<{
      type: string;
      line?: string;
      expected?: string;
    }>;
    fixedCount?: number;
  };
}

// ============================================================================
// PIPELINE STAGES (for waterfall visualization)
// ============================================================================

export interface PipelineStageInfo {
  name: string;
  displayName: string;
  type: ObservationType;
  order: number;
  description: string;
}

export const PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    name: 'context-gatherer',
    displayName: 'Context Gatherer',
    type: 'agent',
    order: 1,
    description: 'Gathers educational context about the topic',
  },
  {
    name: 'curiosity-coordinator',
    displayName: 'Curiosity Coordinator',
    type: 'coordinator',
    order: 2,
    description: 'Selects curiosity hooks and triggers',
  },
  {
    name: 'technique-decision',
    displayName: 'Technique Decision',
    type: 'agent',
    order: 3,
    description: 'Decides memorization vs connection approach',
  },
  {
    name: 'flow-expert',
    displayName: 'Song Flow Expert',
    type: 'coordinator',
    order: 4,
    description: 'Generates flow constraints and suggestions',
  },
  {
    name: 'lyrics-agent',
    displayName: 'Lyrics Agent',
    type: 'agent',
    order: 5,
    description: 'Generates educational song lyrics',
  },
  {
    name: 'lyrics-validator',
    displayName: 'Lyrics Validator',
    type: 'evaluator',
    order: 6,
    description: 'Validates syllable consistency (Turkish)',
  },
  {
    name: 'micro-fixer',
    displayName: 'Micro Fixer',
    type: 'tool',
    order: 7,
    description: 'Fixes individual problematic lines',
  },
  {
    name: 'style-agent',
    displayName: 'Style Agent',
    type: 'agent',
    order: 8,
    description: 'Generates Suno music style prompt',
  },
];

// ============================================================================
// EVENTS (for real-time streaming)
// ============================================================================

export type TraceEvent =
  | { type: 'trace:start'; trace: Pick<Trace, 'id' | 'name' | 'input' | 'startTime'> }
  | { type: 'observation:start'; observation: Observation }
  | { type: 'observation:update'; id: string; updates: Partial<Observation> }
  | { type: 'observation:end'; id: string; output?: unknown; durationMs: number }
  | { type: 'trace:end'; id: string; output: Trace['output']; metrics: Trace['metrics'] }
  | { type: 'error'; id: string; error: string; level: ObservationLevel };

// ============================================================================
// QUERY TYPES (for dashboard)
// ============================================================================

export interface TraceQuery {
  language?: string;
  technique?: string;
  dateFrom?: string;
  dateTo?: string;
  hasError?: boolean;
  minDuration?: number;
  maxDuration?: number;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface TraceListItem {
  id: string;
  name: string;
  topic: string;
  language: string;
  technique: string;
  status: ObservationStatus;
  durationMs: number;
  totalTokens: number;
  errorCount: number;
  startTime: string;
}

export interface TraceSummary {
  totalTraces: number;
  successRate: number;
  avgDurationMs: number;
  avgTokens: number;
  totalCostUsd: number;
  byLanguage: Record<string, number>;
  byTechnique: Record<string, number>;
  errorsByAgent: Record<string, number>;
}
