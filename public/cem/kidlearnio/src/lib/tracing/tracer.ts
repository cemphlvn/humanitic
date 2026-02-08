/**
 * KidLearnio Tracer
 *
 * Lightweight tracing implementation inspired by Langfuse.
 * Provides observe() decorator and active context management.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Trace,
  Observation,
  ObservationType,
  ObservationStatus,
  TraceEvent,
} from './types';

// ============================================================================
// CONTEXT MANAGEMENT (AsyncLocalStorage pattern)
// ============================================================================

interface TraceContext {
  trace: Trace;
  currentObservation?: Observation;
  eventEmitter?: (event: TraceEvent) => void;
}

// Simple context stack (in production, use AsyncLocalStorage)
let activeContext: TraceContext | null = null;

export function getActiveTrace(): Trace | null {
  return activeContext?.trace ?? null;
}

export function getActiveTraceId(): string | null {
  return activeContext?.trace.id ?? null;
}

export function getActiveObservation(): Observation | null {
  return activeContext?.currentObservation ?? null;
}

// ============================================================================
// TRACE LIFECYCLE
// ============================================================================

export interface StartTraceOptions {
  name: string;
  input: Trace['input'];
  sessionId?: string;
  userId?: string;
  tags?: string[];
  onEvent?: (event: TraceEvent) => void;
}

export function startTrace(options: StartTraceOptions): Trace {
  const trace: Trace = {
    id: uuidv4(),
    sessionId: options.sessionId,
    name: options.name,
    input: options.input,
    startTime: new Date().toISOString(),
    metrics: {
      totalTokens: 0,
      totalCostUsd: 0,
      agentCount: 0,
      errorCount: 0,
    },
    observations: [],
    userId: options.userId,
    tags: options.tags,
  };

  activeContext = {
    trace,
    eventEmitter: options.onEvent,
  };

  // Emit start event
  options.onEvent?.({
    type: 'trace:start',
    trace: {
      id: trace.id,
      name: trace.name,
      input: trace.input,
      startTime: trace.startTime,
    },
  });

  return trace;
}

export function endTrace(output: Trace['output']): Trace {
  if (!activeContext) {
    throw new Error('No active trace to end');
  }

  const trace = activeContext.trace;
  trace.endTime = new Date().toISOString();
  trace.durationMs = new Date(trace.endTime).getTime() - new Date(trace.startTime).getTime();
  trace.output = output;

  // Emit end event
  activeContext.eventEmitter?.({
    type: 'trace:end',
    id: trace.id,
    output,
    metrics: trace.metrics,
  });

  const result = { ...trace };
  activeContext = null;

  return result;
}

// ============================================================================
// OBSERVATION LIFECYCLE
// ============================================================================

export interface StartObservationOptions {
  name: string;
  type: ObservationType;
  input?: unknown;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export function startObservation(options: StartObservationOptions): Observation {
  if (!activeContext) {
    throw new Error('No active trace. Call startTrace() first.');
  }

  const observation: Observation = {
    id: uuidv4(),
    traceId: activeContext.trace.id,
    parentId: activeContext.currentObservation?.id,
    name: options.name,
    type: options.type,
    startTime: new Date().toISOString(),
    status: 'running',
    level: 'INFO',
    input: options.input,
    metadata: options.metadata,
    tags: options.tags,
  };

  // Add to trace
  activeContext.trace.observations.push(observation);

  // Update metrics
  if (options.type === 'agent' || options.type === 'coordinator') {
    activeContext.trace.metrics.agentCount++;
  }

  // Set as current for nesting
  activeContext.currentObservation = observation;

  // Emit event
  activeContext.eventEmitter?.({
    type: 'observation:start',
    observation,
  });

  // Return with restore function
  return observation;
}

export function updateObservation(
  id: string,
  updates: Partial<Pick<Observation, 'output' | 'usage' | 'metadata' | 'level' | 'statusMessage'>>
): void {
  if (!activeContext) return;

  const observation = activeContext.trace.observations.find(o => o.id === id);
  if (!observation) return;

  Object.assign(observation, updates);

  // Update trace metrics for token usage
  if (updates.usage) {
    activeContext.trace.metrics.totalTokens += updates.usage.totalTokens;
    activeContext.trace.metrics.totalCostUsd += updates.usage.costUsd ?? 0;
  }

  // Emit event
  activeContext.eventEmitter?.({
    type: 'observation:update',
    id,
    updates,
  });
}

export function endObservation(
  id: string,
  output?: unknown,
  status: ObservationStatus = 'completed'
): void {
  if (!activeContext) return;

  const observation = activeContext.trace.observations.find(o => o.id === id);
  if (!observation) return;

  observation.endTime = new Date().toISOString();
  observation.durationMs = new Date(observation.endTime).getTime() - new Date(observation.startTime).getTime();
  observation.status = status;
  if (output !== undefined) {
    observation.output = output;
  }

  // Track errors
  if (status === 'error') {
    activeContext.trace.metrics.errorCount++;
  }

  // Restore parent as current
  if (activeContext.currentObservation?.id === id) {
    const parent = activeContext.trace.observations.find(o => o.id === observation.parentId);
    activeContext.currentObservation = parent;
  }

  // Emit event
  activeContext.eventEmitter?.({
    type: 'observation:end',
    id,
    output,
    durationMs: observation.durationMs,
  });
}

// ============================================================================
// OBSERVE DECORATOR (Langfuse-style)
// ============================================================================

export interface ObserveOptions {
  name?: string;
  type?: ObservationType;
  captureInput?: boolean;
  captureOutput?: boolean;
}

/**
 * Wrap a function with automatic tracing.
 *
 * @example
 * const tracedGatherContext = observe(gatherContext, {
 *   name: 'context-gatherer',
 *   type: 'agent',
 * });
 */
export function observe<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: ObserveOptions = {}
): (...args: TArgs) => Promise<TResult> {
  const {
    name = fn.name || 'anonymous',
    type = 'tool',
    captureInput = true,
    captureOutput = true,
  } = options;

  return async (...args: TArgs): Promise<TResult> => {
    // If no active trace, just run the function
    if (!activeContext) {
      return fn(...args);
    }

    const observation = startObservation({
      name,
      type,
      input: captureInput ? args : undefined,
    });

    try {
      const result = await fn(...args);

      endObservation(
        observation.id,
        captureOutput ? result : undefined,
        'completed'
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      updateObservation(observation.id, {
        level: 'ERROR',
        statusMessage: errorMessage,
      });

      endObservation(observation.id, { error: errorMessage }, 'error');

      throw error;
    }
  };
}

// ============================================================================
// CONTEXT RUNNER (Langfuse startActiveObservation style)
// ============================================================================

/**
 * Run a function within an observation context.
 *
 * @example
 * await withObservation('lyrics-agent', { type: 'agent' }, async (span) => {
 *   span.update({ model: 'claude-sonnet-4-5' });
 *   const lyrics = await generateLyrics(...);
 *   span.update({ usage: { inputTokens: 100, outputTokens: 200 } });
 *   return lyrics;
 * });
 */
export async function withObservation<T>(
  name: string,
  options: Omit<StartObservationOptions, 'name'>,
  fn: (span: ObservationHandle) => Promise<T>
): Promise<T> {
  const observation = startObservation({ name, ...options });

  const handle: ObservationHandle = {
    id: observation.id,
    update: (updates) => updateObservation(observation.id, updates),
    end: (output, status) => endObservation(observation.id, output, status),
  };

  try {
    const result = await fn(handle);
    endObservation(observation.id, result, 'completed');
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    updateObservation(observation.id, {
      level: 'ERROR',
      statusMessage: errorMessage,
    });
    endObservation(observation.id, { error: errorMessage }, 'error');
    throw error;
  }
}

export interface ObservationHandle {
  id: string;
  update: (updates: Partial<Pick<Observation, 'output' | 'usage' | 'metadata' | 'level' | 'statusMessage'>>) => void;
  end: (output?: unknown, status?: ObservationStatus) => void;
}

// ============================================================================
// TRACE STORAGE (simple in-memory for now, can swap to file/db)
// ============================================================================

const traceStore: Map<string, Trace> = new Map();
const MAX_TRACES = 100;

export function storeTrace(trace: Trace): void {
  traceStore.set(trace.id, trace);

  // Evict old traces if over limit
  if (traceStore.size > MAX_TRACES) {
    const oldestKey = traceStore.keys().next().value;
    if (oldestKey) traceStore.delete(oldestKey);
  }
}

export function getTrace(id: string): Trace | undefined {
  return traceStore.get(id);
}

export function listTraces(limit = 20): Trace[] {
  return Array.from(traceStore.values())
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, limit);
}

export function clearTraces(): void {
  traceStore.clear();
}
