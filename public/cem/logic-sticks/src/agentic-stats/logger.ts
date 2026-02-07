/**
 * Agentic Stats Logger
 *
 * Each instance creates a logger, logs stats locally, and can optionally
 * sync to a shared federation endpoint.
 *
 * Pattern:
 *   const logger = createAgenticLogger('kidlearnio');
 *   logger.log('token_efficiency', 'Observation here', 'Implication here');
 */

import { createStat, generateStatId, validateStat } from './schema.js';
import type { AgenticStat, AgenticStatCategory } from './schema.js';
import * as fs from 'fs';
import * as path from 'path';

export interface AgenticLoggerConfig {
  instance: string;
  logDir?: string;                 // Local log directory
  federationEndpoint?: string;     // Optional: sync to shared endpoint
  autoSync?: boolean;              // Auto-sync shareable stats
  consoleLog?: boolean;            // Also log to console
}

export interface AgenticLogger {
  log: (
    category: AgenticStatCategory,
    observation: string,
    implication: string,
    options?: Partial<AgenticStat>
  ) => AgenticStat;

  logWithMetrics: (
    category: AgenticStatCategory,
    observation: string,
    implication: string,
    metrics: AgenticStat['metrics'],
    options?: Partial<AgenticStat>
  ) => AgenticStat;

  getStats: () => AgenticStat[];
  getStatsByCategory: (category: AgenticStatCategory) => AgenticStat[];
  getShareableStats: () => AgenticStat[];

  // Federation
  syncToFederation: () => Promise<void>;
  importFromFederation: () => Promise<AgenticStat[]>;
}

/**
 * Create an agentic stats logger for an instance
 */
export function createAgenticLogger(config: AgenticLoggerConfig | string): AgenticLogger {
  const cfg: AgenticLoggerConfig = typeof config === 'string'
    ? { instance: config }
    : config;

  const stats: AgenticStat[] = [];
  let sequence = 0;

  // Determine log file path
  const logDir = cfg.logDir ?? process.cwd();
  const logFile = path.join(logDir, `.agentic_stats_${cfg.instance}.jsonl`);

  // Load existing stats if file exists
  try {
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const stat = JSON.parse(line) as AgenticStat;
          stats.push(stat);
          // Update sequence from loaded stats
          const match = stat.id.match(/AS-.*-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num >= sequence) sequence = num + 1;
          }
        } catch {
          // Skip malformed lines
        }
      }
    }
  } catch {
    // File doesn't exist yet, that's fine
  }

  function appendToFile(stat: AgenticStat): void {
    try {
      fs.appendFileSync(logFile, JSON.stringify(stat) + '\n');
    } catch (err) {
      console.error('[AgenticStats] Failed to write:', err);
    }
  }

  function log(
    category: AgenticStatCategory,
    observation: string,
    implication: string,
    options?: Partial<AgenticStat>
  ): AgenticStat {
    const stat = createStat(cfg.instance, category, observation, implication, options);
    stat.id = generateStatId(cfg.instance, sequence++);

    const validation = validateStat(stat);
    if (!validation.valid) {
      console.warn('[AgenticStats] Invalid stat:', validation.errors);
    }

    stats.push(stat);
    appendToFile(stat);

    if (cfg.consoleLog) {
      console.log(`[AgenticStats] ${stat.id} (${category}): ${observation.slice(0, 50)}...`);
    }

    return stat;
  }

  function logWithMetrics(
    category: AgenticStatCategory,
    observation: string,
    implication: string,
    metrics: AgenticStat['metrics'],
    options?: Partial<AgenticStat>
  ): AgenticStat {
    return log(category, observation, implication, { ...options, metrics });
  }

  function getStats(): AgenticStat[] {
    return [...stats];
  }

  function getStatsByCategory(category: AgenticStatCategory): AgenticStat[] {
    return stats.filter(s => s.category === category);
  }

  function getShareableStats(): AgenticStat[] {
    return stats.filter(s => s.shareable);
  }

  async function syncToFederation(): Promise<void> {
    if (!cfg.federationEndpoint) {
      console.warn('[AgenticStats] No federation endpoint configured');
      return;
    }

    const shareable = getShareableStats();
    // TODO: Implement actual sync to federation endpoint
    console.log(`[AgenticStats] Would sync ${shareable.length} stats to ${cfg.federationEndpoint}`);
  }

  async function importFromFederation(): Promise<AgenticStat[]> {
    if (!cfg.federationEndpoint) {
      console.warn('[AgenticStats] No federation endpoint configured');
      return [];
    }

    // TODO: Implement actual import from federation endpoint
    console.log(`[AgenticStats] Would import from ${cfg.federationEndpoint}`);
    return [];
  }

  return {
    log,
    logWithMetrics,
    getStats,
    getStatsByCategory,
    getShareableStats,
    syncToFederation,
    importFromFederation,
  };
}

/**
 * Aggregate insights from multiple instance logs
 */
export function aggregateInsights(stats: AgenticStat[]): {
  topPatterns: Array<{ pattern: string; count: number; instances: string[] }>;
  categoryBreakdown: Record<AgenticStatCategory, number>;
  breakthroughs: AgenticStat[];
} {
  // Count tags across all stats
  const tagCounts = new Map<string, { count: number; instances: Set<string> }>();
  const categoryBreakdown = {} as Record<AgenticStatCategory, number>;
  const breakthroughs: AgenticStat[] = [];

  for (const stat of stats) {
    // Category breakdown
    categoryBreakdown[stat.category] = (categoryBreakdown[stat.category] || 0) + 1;

    // Tag patterns
    for (const tag of stat.tags) {
      if (!tagCounts.has(tag)) {
        tagCounts.set(tag, { count: 0, instances: new Set() });
      }
      const entry = tagCounts.get(tag)!;
      entry.count++;
      entry.instances.add(stat.instance);
    }

    // Collect breakthroughs
    if (stat.severity === 'breakthrough') {
      breakthroughs.push(stat);
    }
  }

  // Convert to sorted array
  const topPatterns = Array.from(tagCounts.entries())
    .map(([pattern, data]) => ({
      pattern,
      count: data.count,
      instances: Array.from(data.instances),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { topPatterns, categoryBreakdown, breakthroughs };
}
