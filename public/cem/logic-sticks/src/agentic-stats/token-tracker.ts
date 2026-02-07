/**
 * Token Tracker — Decorator-based Token Usage Auditing
 *
 * Usage:
 *   @trackTokens('lyrics-agent')
 *   async function generateLyrics(...) { ... }
 *
 * "we can help suggest to the truthful beauty"
 */

import { createAgenticLogger, type AgenticLogger } from './logger.js';

// Global tracking state
interface TokenTrackingState {
  tourId: string;
  startTime: number;
  agents: Map<string, AgentTokenStats>;
  totalTokens: number;
  logger: AgenticLogger | null;
}

interface AgentTokenStats {
  name: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
}

interface TourSummary {
  tourId: string;
  durationMs: number;
  totalTokens: number;
  agents: AgentTokenStats[];
  costEstimateUsd: number;
}

// Singleton state
let currentTour: TokenTrackingState | null = null;

// Token cost estimates (per 1M tokens)
const TOKEN_COSTS = {
  input: 3.0,   // $3 per 1M input tokens (Claude Sonnet estimate)
  output: 15.0, // $15 per 1M output tokens
};

/**
 * Start a new tracking tour
 */
export function startTour(tourId?: string, instance?: string): string {
  const id = tourId || `tour-${Date.now()}`;

  currentTour = {
    tourId: id,
    startTime: Date.now(),
    agents: new Map(),
    totalTokens: 0,
    logger: instance ? createAgenticLogger(instance) : null,
  };

  console.log(`[TokenTracker] Tour started: ${id}`);
  return id;
}

/**
 * End current tour and get summary
 */
export function endTour(): TourSummary | null {
  if (!currentTour) {
    console.warn('[TokenTracker] No active tour');
    return null;
  }

  const summary: TourSummary = {
    tourId: currentTour.tourId,
    durationMs: Date.now() - currentTour.startTime,
    totalTokens: currentTour.totalTokens,
    agents: Array.from(currentTour.agents.values()),
    costEstimateUsd: estimateCost(currentTour.totalTokens),
  };

  // Log to agentic stats if logger configured
  if (currentTour.logger) {
    currentTour.logger.logWithMetrics(
      'token_efficiency',
      `Tour ${summary.tourId}: ${summary.totalTokens} tokens across ${summary.agents.length} agents`,
      'we can help suggest to the truthful beauty',
      {
        tokensUsed: summary.totalTokens,
        latencyMs: summary.durationMs,
        costUsd: summary.costEstimateUsd,
      },
      {
        shareable: true,
        tags: ['tour-summary', ...summary.agents.map(a => a.name)],
      }
    );
  }

  console.log(`[TokenTracker] Tour ended: ${summary.tourId}`);
  console.log(`  Total tokens: ${summary.totalTokens}`);
  console.log(`  Duration: ${summary.durationMs}ms`);
  console.log(`  Cost estimate: $${summary.costEstimateUsd.toFixed(4)}`);

  currentTour = null;
  return summary;
}

/**
 * Record token usage for an agent
 */
export function recordTokens(
  agentName: string,
  inputTokens: number,
  outputTokens: number,
  latencyMs?: number
): void {
  if (!currentTour) {
    // Auto-start tour if not started
    startTour();
  }

  const total = inputTokens + outputTokens;

  if (!currentTour!.agents.has(agentName)) {
    currentTour!.agents.set(agentName, {
      name: agentName,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      latencyMs: 0,
    });
  }

  const stats = currentTour!.agents.get(agentName)!;
  stats.calls++;
  stats.inputTokens += inputTokens;
  stats.outputTokens += outputTokens;
  stats.totalTokens += total;
  stats.latencyMs += latencyMs || 0;

  currentTour!.totalTokens += total;

  console.log(`[TokenTracker] ${agentName}: +${total} tokens (${inputTokens} in, ${outputTokens} out)`);
}

/**
 * Get current tour stats (without ending)
 */
export function getCurrentStats(): { tourId: string; agents: AgentTokenStats[]; totalTokens: number } | null {
  if (!currentTour) return null;

  return {
    tourId: currentTour.tourId,
    agents: Array.from(currentTour.agents.values()),
    totalTokens: currentTour.totalTokens,
  };
}

/**
 * Estimate cost from token count
 */
function estimateCost(tokens: number): number {
  // Assume 30% input, 70% output ratio
  const inputTokens = tokens * 0.3;
  const outputTokens = tokens * 0.7;

  return (inputTokens * TOKEN_COSTS.input / 1_000_000) +
         (outputTokens * TOKEN_COSTS.output / 1_000_000);
}

/**
 * Decorator factory for tracking tokens
 *
 * Usage:
 *   @trackTokens('agent-name')
 *   async function myFunction() { ... }
 */
export function trackTokens(agentName: string) {
  return function <T extends (...args: unknown[]) => Promise<unknown>>(
    target: T,
    context: ClassMethodDecoratorContext | { kind: string; name: string }
  ): T {
    const methodName = String(context.name);

    return async function (this: unknown, ...args: unknown[]) {
      const start = Date.now();

      try {
        const result = await target.apply(this, args);

        // Extract token info from result if available
        const tokens = extractTokenInfo(result);
        recordTokens(
          `${agentName}:${methodName}`,
          tokens.input,
          tokens.output,
          Date.now() - start
        );

        return result;
      } catch (error) {
        // Still record the attempt
        recordTokens(`${agentName}:${methodName}`, 0, 0, Date.now() - start);
        throw error;
      }
    } as T;
  };
}

/**
 * Wrapper function for non-decorator usage
 *
 * Usage:
 *   const result = await withTokenTracking('agent-name', async () => {
 *     return await someApiCall();
 *   });
 */
export async function withTokenTracking<T>(
  agentName: string,
  fn: () => Promise<T>,
  tokenEstimate?: { input: number; output: number }
): Promise<T> {
  const start = Date.now();

  try {
    const result = await fn();

    const tokens = tokenEstimate || extractTokenInfo(result);
    recordTokens(agentName, tokens.input, tokens.output, Date.now() - start);

    return result;
  } catch (error) {
    recordTokens(agentName, 0, 0, Date.now() - start);
    throw error;
  }
}

/**
 * Extract token info from API response
 */
function extractTokenInfo(result: unknown): { input: number; output: number } {
  // Handle Anthropic API response format
  if (result && typeof result === 'object') {
    const r = result as Record<string, unknown>;

    // Anthropic format
    if (r.usage && typeof r.usage === 'object') {
      const usage = r.usage as Record<string, number>;
      return {
        input: usage.input_tokens || 0,
        output: usage.output_tokens || 0,
      };
    }

    // OpenAI format
    if (r.usage && typeof r.usage === 'object') {
      const usage = r.usage as Record<string, number>;
      return {
        input: usage.prompt_tokens || 0,
        output: usage.completion_tokens || 0,
      };
    }
  }

  // Default estimate based on string length
  if (typeof result === 'string') {
    return { input: 0, output: Math.ceil(result.length / 4) };
  }

  return { input: 0, output: 0 };
}

/**
 * Print formatted tour summary
 */
export function printTourSummary(summary: TourSummary): void {
  console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    TOKEN TRACKING — TOUR SUMMARY                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  console.log(`Tour ID: ${summary.tourId}`);
  console.log(`Duration: ${summary.durationMs}ms`);
  console.log(`Total Tokens: ${summary.totalTokens}`);
  console.log(`Cost Estimate: $${summary.costEstimateUsd.toFixed(4)}\n`);

  console.log('AGENT BREAKDOWN:');
  console.log('─────────────────────────────────────────────────────────────');

  for (const agent of summary.agents.sort((a, b) => b.totalTokens - a.totalTokens)) {
    const pct = ((agent.totalTokens / summary.totalTokens) * 100).toFixed(1);
    console.log(`  ${agent.name}`);
    console.log(`    Calls: ${agent.calls}`);
    console.log(`    Tokens: ${agent.totalTokens} (${pct}%) — ${agent.inputTokens} in, ${agent.outputTokens} out`);
    console.log(`    Latency: ${agent.latencyMs}ms`);
  }

  console.log('\n"we can help suggest to the truthful beauty"\n');
}
