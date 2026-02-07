/**
 * Agentic Stats Schema
 *
 * Shared format for all instances to log their operational learnings.
 * Enables federated meta-learning across the Humanitic ecosystem.
 *
 * Usage: Import this schema in any instance to log stats in compatible format.
 */

export interface AgenticStat {
  // Identity
  id: string;                      // Auto-generated: AS-{instance}-{sequence}
  instance: string;                // e.g., "kidlearnio", "prompt-writer"
  timestamp: string;               // ISO 8601

  // Classification
  category: AgenticStatCategory;
  severity: 'observation' | 'insight' | 'breakthrough' | 'warning';

  // Content
  observation: string;             // What was observed
  implication: string;             // What it means for the system

  // Metrics (optional, category-dependent)
  metrics?: {
    tokensUsed?: number;
    latencyMs?: number;
    successRate?: number;
    costUsd?: number;
    qualityScore?: number;         // 0-100 subjective quality
    [key: string]: number | undefined;
  };

  // Reproducibility
  context?: {
    input?: string;                // Sanitized input that triggered this
    config?: Record<string, unknown>;
    stackTrace?: string[];         // Which sticks/agents were involved
  };

  // Federation
  shareable: boolean;              // Can this be shared with other instances?
  tags: string[];                  // For cross-instance pattern matching
}

export type AgenticStatCategory =
  | 'token_efficiency'      // Token usage patterns
  | 'latency_pattern'       // Speed observations
  | 'quality_correlation'   // What improves output quality
  | 'failure_mode'          // What causes failures
  | 'architecture_insight'  // Structural learnings
  | 'composition_pattern'   // How sticks/agents compose
  | 'language_specific'     // Language-dependent behaviors
  | 'age_specific'          // Age-range dependent behaviors
  | 'cost_optimization'     // Cost reduction patterns
  | 'user_preference'       // What users prefer
  | 'policy_suggestion';    // Suggested policies for ecosystem

/**
 * Generate stat ID
 */
export function generateStatId(instance: string, sequence: number): string {
  return `AS-${instance}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Validate a stat entry
 */
export function validateStat(stat: Partial<AgenticStat>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!stat.instance) errors.push('Missing instance');
  if (!stat.category) errors.push('Missing category');
  if (!stat.observation) errors.push('Missing observation');
  if (!stat.implication) errors.push('Missing implication');

  return { valid: errors.length === 0, errors };
}

/**
 * Create a minimal stat entry
 */
export function createStat(
  instance: string,
  category: AgenticStatCategory,
  observation: string,
  implication: string,
  options?: Partial<AgenticStat>
): AgenticStat {
  return {
    id: '', // Set by logger
    instance,
    timestamp: new Date().toISOString(),
    category,
    severity: options?.severity ?? 'observation',
    observation,
    implication,
    metrics: options?.metrics,
    context: options?.context,
    shareable: options?.shareable ?? true,
    tags: options?.tags ?? [],
  };
}
