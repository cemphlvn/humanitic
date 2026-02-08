'use client';

/**
 * TraceDetail — Deep dive into a single trace
 *
 * UX Principles:
 * - Waterfall: Visual timeline of agent execution
 * - Expandable: Click to see I/O for each observation
 * - Token attribution: See cost per agent
 */

import { useState } from 'react';
import type { Trace, Observation } from '@/lib/tracing/types';

interface TraceDetailProps {
  trace: Trace;
}

export function TraceDetail({ trace }: TraceDetailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Build tree structure from flat observations
  const rootObservations = trace.observations.filter(o => !o.parentId);

  const totalDuration = trace.durationMs ?? 0;

  return (
    <div className="trace-detail">
      {/* Header */}
      <div className="trace-header">
        <h2 className="trace-title">{trace.input.topic}</h2>
        <div className="trace-badges">
          <span className="badge lang">{trace.input.language.toUpperCase()}</span>
          <span className="badge tech">{trace.input.technique}</span>
          <span className={`badge status ${trace.output?.success ? 'success' : 'error'}`}>
            {trace.output?.success ? 'Success' : 'Failed'}
          </span>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="metrics-row">
        <MetricCard label="Duration" value={formatDuration(trace.durationMs)} />
        <MetricCard label="Total Tokens" value={trace.metrics.totalTokens.toLocaleString()} />
        <MetricCard label="Agents" value={trace.metrics.agentCount.toString()} />
        <MetricCard label="Errors" value={trace.metrics.errorCount.toString()} isError={trace.metrics.errorCount > 0} />
      </div>

      {/* Waterfall Timeline */}
      <div className="waterfall-section">
        <h3 className="section-title">Pipeline Waterfall</h3>
        <div className="waterfall">
          {rootObservations.map(obs => (
            <WaterfallRow
              key={obs.id}
              observation={obs}
              allObservations={trace.observations}
              totalDuration={totalDuration}
              expandedId={expandedId}
              onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
              depth={0}
            />
          ))}
        </div>
      </div>

      {/* Output Preview */}
      {trace.output && (
        <div className="output-section">
          <h3 className="section-title">Final Output</h3>
          {trace.output.lyrics && (
            <div className="output-block">
              <h4>Lyrics</h4>
              <pre className="output-content">{trace.output.lyrics}</pre>
            </div>
          )}
          {trace.output.style && (
            <div className="output-block">
              <h4>Style Prompt</h4>
              <pre className="output-content">{trace.output.style}</pre>
            </div>
          )}
          {trace.output.error && (
            <div className="output-block error">
              <h4>Error</h4>
              <pre className="output-content">{trace.output.error}</pre>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .trace-detail {
          padding: 20px;
          height: 100%;
          overflow-y: auto;
        }

        .trace-header {
          margin-bottom: 20px;
        }

        .trace-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 10px 0;
        }

        .trace-badges {
          display: flex;
          gap: 8px;
        }

        .badge {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 500;
        }

        .badge.lang {
          background: #e3f2fd;
          color: #1565c0;
        }

        .badge.tech {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .badge.status.success {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .badge.status.error {
          background: #ffebee;
          color: #c62828;
        }

        .metrics-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #495057;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .waterfall-section {
          margin-bottom: 24px;
        }

        .waterfall {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 12px;
        }

        .output-section {
          margin-top: 24px;
        }

        .output-block {
          margin-bottom: 16px;
        }

        .output-block h4 {
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #495057;
        }

        .output-block.error h4 {
          color: #c62828;
        }

        .output-content {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 12px;
          border-radius: 6px;
          font-size: 13px;
          line-height: 1.5;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 300px;
          overflow-y: auto;
        }

        .output-block.error .output-content {
          background: #fff5f5;
          color: #c62828;
        }
      `}</style>
    </div>
  );
}

// Metric card component
function MetricCard({
  label,
  value,
  isError = false,
}: {
  label: string;
  value: string;
  isError?: boolean;
}) {
  return (
    <div className={`metric-card ${isError ? 'error' : ''}`}>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>

      <style jsx>{`
        .metric-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }

        .metric-card.error .metric-value {
          color: #c62828;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 600;
          color: #212529;
        }

        .metric-label {
          font-size: 12px;
          color: #6c757d;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}

// Waterfall row component
function WaterfallRow({
  observation,
  allObservations,
  totalDuration,
  expandedId,
  onToggle,
  depth,
}: {
  observation: Observation;
  allObservations: Observation[];
  totalDuration: number;
  expandedId: string | null;
  onToggle: (id: string) => void;
  depth: number;
}) {
  const children = allObservations.filter(o => o.parentId === observation.id);
  const isExpanded = expandedId === observation.id;

  // Calculate bar position (relative to trace start)
  const startOffset = observation.durationMs
    ? ((new Date(observation.startTime).getTime() - (totalDuration ? Date.now() - totalDuration : Date.now())) / totalDuration) * 100
    : 0;
  const width = totalDuration > 0 && observation.durationMs
    ? (observation.durationMs / totalDuration) * 100
    : 0;

  const typeColors: Record<string, string> = {
    agent: '#4f46e5',
    coordinator: '#7c3aed',
    generation: '#2563eb',
    tool: '#059669',
    evaluator: '#d97706',
    guardrail: '#dc2626',
    pipeline: '#374151',
  };

  const barColor = typeColors[observation.type] ?? '#6b7280';

  return (
    <div className="waterfall-row">
      <div
        className="row-header"
        onClick={() => onToggle(observation.id)}
        style={{ paddingLeft: depth * 20 + 8 }}
      >
        <span className="expand-icon">{children.length > 0 || observation.input ? (isExpanded ? '▼' : '▶') : '•'}</span>
        <span className="obs-name">{observation.name}</span>
        <span className="obs-type" style={{ background: barColor }}>{observation.type}</span>
        <span className="obs-duration">{formatDuration(observation.durationMs)}</span>
        {observation.usage && (
          <span className="obs-tokens">{observation.usage.totalTokens} tok</span>
        )}
        {observation.status === 'error' && (
          <span className="obs-error">ERROR</span>
        )}
      </div>

      {/* Timeline bar */}
      <div className="timeline-bar-container">
        <div
          className="timeline-bar"
          style={{
            left: `${Math.max(0, startOffset)}%`,
            width: `${Math.max(2, width)}%`,
            background: barColor,
          }}
        />
      </div>

      {/* Expanded I/O view */}
      {isExpanded ? (
        <div className="expanded-content" style={{ marginLeft: depth * 20 + 28 }}>
          {observation.input !== undefined && observation.input !== null ? (
            <div className="io-block">
              <span className="io-label">INPUT</span>
              <pre className="io-content">{JSON.stringify(observation.input, null, 2)}</pre>
            </div>
          ) : null}
          {observation.output !== undefined && observation.output !== null ? (
            <div className="io-block">
              <span className="io-label">OUTPUT</span>
              <pre className="io-content">{JSON.stringify(observation.output, null, 2)}</pre>
            </div>
          ) : null}
          {observation.statusMessage ? (
            <div className="io-block error">
              <span className="io-label">ERROR</span>
              <pre className="io-content">{observation.statusMessage}</pre>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Nested children */}
      {children.map(child => (
        <WaterfallRow
          key={child.id}
          observation={child}
          allObservations={allObservations}
          totalDuration={totalDuration}
          expandedId={expandedId}
          onToggle={onToggle}
          depth={depth + 1}
        />
      ))}

      <style jsx>{`
        .waterfall-row {
          margin-bottom: 4px;
        }

        .row-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }

        .row-header:hover {
          background: #e9ecef;
        }

        .expand-icon {
          width: 12px;
          font-size: 10px;
          color: #6c757d;
        }

        .obs-name {
          flex: 1;
          font-weight: 500;
        }

        .obs-type {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;
          color: white;
          text-transform: uppercase;
        }

        .obs-duration {
          font-size: 12px;
          color: #6c757d;
          min-width: 50px;
          text-align: right;
        }

        .obs-tokens {
          font-size: 11px;
          color: #495057;
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .obs-error {
          font-size: 10px;
          color: white;
          background: #dc2626;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .timeline-bar-container {
          height: 4px;
          background: #e9ecef;
          border-radius: 2px;
          margin: 4px 8px 4px ${depth * 20 + 28}px;
          position: relative;
        }

        .timeline-bar {
          position: absolute;
          height: 100%;
          border-radius: 2px;
          min-width: 4px;
        }

        .expanded-content {
          padding: 8px;
          background: #f1f3f4;
          border-radius: 4px;
          margin: 4px 8px 8px 8px;
        }

        .io-block {
          margin-bottom: 8px;
        }

        .io-block:last-child {
          margin-bottom: 0;
        }

        .io-label {
          font-size: 10px;
          font-weight: 600;
          color: #495057;
          display: block;
          margin-bottom: 4px;
        }

        .io-block.error .io-label {
          color: #c62828;
        }

        .io-content {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 8px;
          border-radius: 4px;
          font-size: 11px;
          line-height: 1.4;
          overflow-x: auto;
          max-height: 150px;
          overflow-y: auto;
          margin: 0;
        }

        .io-block.error .io-content {
          background: #fff5f5;
          color: #c62828;
        }
      `}</style>
    </div>
  );
}

function formatDuration(ms?: number): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
