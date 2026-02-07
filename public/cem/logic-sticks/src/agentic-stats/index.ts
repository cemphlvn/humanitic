/**
 * Agentic Stats — Federated Meta-Learning for Humanitic Instances
 *
 * Every instance can:
 * 1. Log operational learnings in a shared format
 * 2. Aggregate insights locally
 * 3. Sync shareable insights to federation (optional)
 * 4. Import breakthroughs from other instances
 *
 * Usage:
 *   import { createAgenticLogger } from '@humanitic/logic-sticks';
 *
 *   const logger = createAgenticLogger('my-instance');
 *   logger.log('token_efficiency', 'Observation', 'Implication');
 */

export {
  type AgenticStat,
  type AgenticStatCategory,
  createStat,
  generateStatId,
  validateStat,
} from './schema.js';

export {
  type AgenticLogger,
  type AgenticLoggerConfig,
  createAgenticLogger,
  aggregateInsights,
} from './logger.js';

export {
  startTour,
  endTour,
  recordTokens,
  getCurrentStats,
  trackTokens,
  withTokenTracking,
  printTourSummary,
} from './token-tracker.js';
