'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TraceEvent } from '@/lib/tracing';
import type { Observation } from '@/lib/tracing/types';

interface AgentActivityPanelProps {
  /** SSE stream URL to connect to */
  streamUrl?: string;
  /** Manual events (for testing/replay) */
  events?: TraceEvent[];
  /** Called when final result arrives */
  onResult?: (result: unknown) => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Starts connection when true */
  isActive: boolean;
  /** Request body for POST */
  requestBody?: Record<string, unknown>;
}

interface ObservationState {
  observation: Partial<Observation>;
  isExpanded: boolean;
  animationClass: string;
}

/**
 * AgentActivityPanel — Real-time observability for agent pipeline
 *
 * UX Patterns Applied:
 * - Progressive Disclosure: Simple pill → Expanded I/O on click
 * - Agent Status UI: Real-time "thinking" states with pulse animation
 * - Staggered Animation: New observations cascade in
 * - Event Log Pattern: Observations as immutable event stream
 */
export function AgentActivityPanel({
  streamUrl = '/api/generate/stream',
  events: manualEvents,
  onResult,
  onError,
  isActive,
  requestBody,
}: AgentActivityPanelProps) {
  const [observations, setObservations] = useState<Map<string, ObservationState>>(new Map());
  const [traceId, setTraceId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentThinking, setCurrentThinking] = useState<string | null>(null);

  // Process incoming trace event
  const processEvent = useCallback((event: TraceEvent) => {
    switch (event.type) {
      case 'trace:start':
        setTraceId(event.trace.id);
        setCurrentThinking('Initializing pipeline...');
        break;

      case 'observation:start':
        setObservations((prev) => {
          const next = new Map(prev);
          next.set(event.observation.id, {
            observation: event.observation,
            isExpanded: false,
            animationClass: 'observation-enter',
          });
          return next;
        });
        setCurrentThinking(getThinkingLabel(event.observation.name, event.observation.type));
        break;

      case 'observation:update':
        setObservations((prev) => {
          const next = new Map(prev);
          const existing = next.get(event.id);
          if (existing) {
            next.set(event.id, {
              ...existing,
              observation: { ...existing.observation, ...event.updates },
            });
          }
          return next;
        });
        break;

      case 'observation:end':
        setObservations((prev) => {
          const next = new Map(prev);
          const existing = next.get(event.id);
          if (existing) {
            next.set(event.id, {
              ...existing,
              observation: {
                ...existing.observation,
                output: event.output,
                durationMs: event.durationMs,
                status: 'completed',
              },
              animationClass: 'observation-complete',
            });
          }
          return next;
        });
        break;

      case 'trace:end':
        setCurrentThinking(null);
        break;
    }
  }, []);

  // SSE connection effect
  useEffect(() => {
    if (!isActive || !requestBody) return;

    // Reset state
    setObservations(new Map());
    setTraceId(null);
    setCurrentThinking('Connecting...');

    const abortController = new AbortController();

    async function connect() {
      try {
        const response = await fetch(streamUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error('Failed to connect to stream');
        }

        setIsConnected(true);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'result') {
                  onResult?.(data.data);
                } else if (data.type === 'error') {
                  onError?.(data.error);
                } else {
                  processEvent(data as TraceEvent);
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          onError?.(err instanceof Error ? err.message : 'Connection failed');
        }
      } finally {
        setIsConnected(false);
        setCurrentThinking(null);
      }
    }

    connect();

    return () => {
      abortController.abort();
    };
  }, [isActive, requestBody, streamUrl, processEvent, onResult, onError]);

  // Process manual events
  useEffect(() => {
    if (manualEvents) {
      for (const event of manualEvents) {
        processEvent(event);
      }
    }
  }, [manualEvents, processEvent]);

  // Toggle observation expansion
  const toggleExpand = (id: string) => {
    setObservations((prev) => {
      const next = new Map(prev);
      const existing = next.get(id);
      if (existing) {
        next.set(id, { ...existing, isExpanded: !existing.isExpanded });
      }
      return next;
    });
  };

  const observationList = Array.from(observations.values());

  if (!isActive && observationList.length === 0) {
    return null;
  }

  return (
    <div className="agent-activity-panel">
      {/* Header with trace info */}
      <div className="activity-header">
        <div className="activity-title">
          <i className="fas fa-brain" />
          <span>Agent Activity</span>
          {isConnected && <span className="live-indicator" />}
        </div>
        {traceId && traceId !== 'pending' && (
          <span className="trace-id">
            <i className="fas fa-fingerprint" />
            {traceId.slice(0, 8)}
          </span>
        )}
      </div>

      {/* Thinking indicator */}
      {currentThinking && (
        <div className="thinking-indicator">
          <div className="thinking-dots">
            <span />
            <span />
            <span />
          </div>
          <span className="thinking-text">{currentThinking}</span>
        </div>
      )}

      {/* Observation list with progressive disclosure */}
      <div className="observations-list">
        {observationList.map(({ observation, isExpanded, animationClass }, index) => (
          <div
            key={observation.id}
            className={`observation-item ${animationClass} ${observation.status === 'completed' ? 'completed' : observation.status === 'running' ? 'running' : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Collapsed view - always visible */}
            <button
              className="observation-header"
              onClick={() => observation.id && toggleExpand(observation.id)}
              aria-expanded={isExpanded}
            >
              <span className="observation-icon">{getAgentIcon(observation.type)}</span>
              <span className="observation-name">{formatAgentName(observation.name)}</span>
              <span className="observation-type">{observation.type}</span>
              {observation.durationMs !== undefined && (
                <span className="observation-duration">{observation.durationMs}ms</span>
              )}
              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} expand-icon`} />
            </button>

            {/* Expanded view - I/O details */}
            {isExpanded && (
              <div className="observation-details">
                {observation.input !== undefined && (
                  <div className="io-section">
                    <div className="io-label">
                      <i className="fas fa-arrow-right" /> Input
                    </div>
                    <pre className="io-content">{formatIO(observation.input)}</pre>
                  </div>
                )}
                {observation.output !== undefined && (
                  <div className="io-section">
                    <div className="io-label">
                      <i className="fas fa-arrow-left" /> Output
                    </div>
                    <pre className="io-content">{formatIO(observation.output)}</pre>
                  </div>
                )}
                {observation.metadata && Object.keys(observation.metadata).length > 0 && (
                  <div className="io-section metadata">
                    <div className="io-label">
                      <i className="fas fa-tags" /> Metadata
                    </div>
                    <div className="metadata-pills">
                      {Object.entries(observation.metadata).map(([key, value]) => (
                        <span key={key} className="metadata-pill">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .agent-activity-panel {
          background: var(--knowledge-surface);
          border-radius: 12px;
          margin-top: var(--space-4);
          overflow: hidden;
          border: 1px solid var(--knowledge-light);
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-3) var(--space-4);
          background: white;
          border-bottom: 1px solid var(--knowledge-light);
        }

        .activity-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-weight: 600;
          color: var(--knowledge-dark);
        }

        .activity-title i {
          color: var(--spark-primary);
        }

        .live-indicator {
          width: 8px;
          height: 8px;
          background: var(--growth-secondary);
          border-radius: 50%;
          animation: pulse-live 1.5s infinite;
        }

        @keyframes pulse-live {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .trace-id {
          font-family: monospace;
          font-size: 0.75rem;
          color: var(--knowledge-medium);
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .thinking-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: linear-gradient(90deg, var(--spark-primary-light), transparent);
          color: var(--spark-primary-dark);
          font-size: 0.85rem;
        }

        .thinking-dots {
          display: flex;
          gap: 4px;
        }

        .thinking-dots span {
          width: 6px;
          height: 6px;
          background: var(--spark-primary);
          border-radius: 50%;
          animation: bounce-dot 0.6s infinite ease-in-out;
        }

        .thinking-dots span:nth-child(2) { animation-delay: 0.1s; }
        .thinking-dots span:nth-child(3) { animation-delay: 0.2s; }

        @keyframes bounce-dot {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .observations-list {
          padding: var(--space-2);
          max-height: 400px;
          overflow-y: auto;
        }

        .observation-item {
          background: white;
          border-radius: 8px;
          margin-bottom: var(--space-2);
          border: 1px solid transparent;
          transition: all 0.2s ease;
          opacity: 0;
          transform: translateX(-10px);
          animation: slide-in 0.3s ease forwards;
        }

        @keyframes slide-in {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .observation-item.running {
          border-color: var(--spark-primary-light);
          box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.1);
        }

        .observation-item.completed {
          border-color: var(--growth-secondary-light);
        }

        .observation-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          font-size: 0.85rem;
        }

        .observation-header:hover {
          background: var(--knowledge-surface);
        }

        .observation-icon {
          font-size: 1rem;
          width: 24px;
          text-align: center;
        }

        .observation-name {
          flex: 1;
          font-weight: 500;
          color: var(--knowledge-dark);
        }

        .observation-type {
          font-size: 0.7rem;
          padding: 2px 6px;
          background: var(--knowledge-surface);
          border-radius: 4px;
          color: var(--knowledge-medium);
          text-transform: uppercase;
        }

        .observation-duration {
          font-family: monospace;
          font-size: 0.75rem;
          color: var(--growth-secondary-dark);
        }

        .expand-icon {
          color: var(--knowledge-light);
          font-size: 0.7rem;
        }

        .observation-details {
          padding: 0 var(--space-3) var(--space-3);
          border-top: 1px solid var(--knowledge-surface);
        }

        .io-section {
          margin-top: var(--space-2);
        }

        .io-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--knowledge-medium);
          margin-bottom: var(--space-1);
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .io-label i {
          font-size: 0.6rem;
        }

        .io-content {
          font-family: monospace;
          font-size: 0.75rem;
          background: var(--knowledge-surface);
          padding: var(--space-2);
          border-radius: 4px;
          overflow-x: auto;
          max-height: 150px;
          overflow-y: auto;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .metadata-pills {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-1);
        }

        .metadata-pill {
          font-size: 0.7rem;
          padding: 2px 8px;
          background: var(--spark-primary-light);
          color: var(--spark-primary-dark);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

// Helper functions
function getAgentIcon(type?: string): string {
  switch (type) {
    case 'agent':
      return '🤖';
    case 'coordinator':
      return '🎯';
    case 'tool':
      return '🔧';
    case 'evaluator':
      return '✓';
    case 'generation':
      return '✨';
    default:
      return '📦';
  }
}

function formatAgentName(name?: string): string {
  if (!name) return 'Unknown';
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getThinkingLabel(name?: string, type?: string): string {
  const formattedName = formatAgentName(name);
  switch (type) {
    case 'agent':
      return `${formattedName} is thinking...`;
    case 'coordinator':
      return `${formattedName} is coordinating...`;
    case 'tool':
      return `Running ${formattedName}...`;
    case 'evaluator':
      return `${formattedName} is validating...`;
    default:
      return `Processing ${formattedName}...`;
  }
}

function formatIO(data: unknown): string {
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}
