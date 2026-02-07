/**
 * Agentic Logger for KidLearnio
 *
 * Integrates with Truth Technician protocol for Level 2 certification.
 * "we can help suggest to the truthful beauty"
 */

import { createAgenticLogger, type AgenticLogger } from '@humanitic/logic-sticks';
import path from 'path';

// Singleton logger instance
let logger: AgenticLogger | null = null;

/**
 * Get or create the kidlearnio agentic logger
 */
export function getAgenticLogger(): AgenticLogger {
  if (!logger) {
    logger = createAgenticLogger({
      instance: 'kidlearnio',
      logDir: path.resolve(process.cwd(), '..'), // logs to public/cem/
      consoleLog: process.env.NODE_ENV === 'development',
    });
  }
  return logger;
}

/**
 * Log a pipeline run with metrics
 */
export function logPipelineRun(params: {
  topic: string;
  language: string;
  technique: string;
  ageRange: [number, number];
  durationMs: number;
  success: boolean;
  tokensEstimate?: number;
  error?: string;
}): void {
  const log = getAgenticLogger();

  if (params.success) {
    log.logWithMetrics(
      'quality_correlation',
      `Generated ${params.technique} song for "${params.topic}" in ${params.language}`,
      'Pipeline completed successfully',
      {
        latencyMs: params.durationMs,
        tokensUsed: params.tokensEstimate,
        qualityScore: 80, // Base score for successful generation
      },
      {
        shareable: true,
        tags: [params.language, params.technique, `age-${params.ageRange[0]}-${params.ageRange[1]}`],
      }
    );
  } else {
    log.log(
      'failure_mode',
      `Failed to generate for "${params.topic}": ${params.error}`,
      'Investigate failure pattern',
      {
        severity: 'warning',
        shareable: true,
        tags: ['failure', params.language, params.technique],
      }
    );
  }
}

/**
 * Log an architectural insight
 */
export function logInsight(observation: string, implication: string): void {
  const log = getAgenticLogger();
  log.log('architecture_insight', observation, implication, {
    severity: 'insight',
    shareable: true,
  });
}

/**
 * Log token efficiency observation
 */
export function logTokenEfficiency(observation: string, metrics: { tokensUsed: number; qualityScore?: number }): void {
  const log = getAgenticLogger();
  log.logWithMetrics(
    'token_efficiency',
    observation,
    'we can help suggest to the truthful beauty',
    metrics,
    { shareable: true }
  );
}
