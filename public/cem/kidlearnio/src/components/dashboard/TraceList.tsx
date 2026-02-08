'use client';

/**
 * TraceList — Browse all generation traces
 *
 * UX Principles:
 * - Scannable: Key metrics visible at a glance
 * - Filterable: Language, technique, status
 * - Color-coded: Success (green), error (red), running (blue)
 */

import { useState } from 'react';
import type { Trace } from '@/lib/tracing/types';

interface TraceListProps {
  traces: Trace[];
  onSelectTrace: (traceId: string) => void;
  selectedTraceId?: string;
}

export function TraceList({ traces, onSelectTrace, selectedTraceId }: TraceListProps) {
  const [filter, setFilter] = useState({
    language: '',
    technique: '',
    status: '',
  });

  const filteredTraces = traces.filter(trace => {
    if (filter.language && trace.input.language !== filter.language) return false;
    if (filter.technique && trace.input.technique !== filter.technique) return false;
    if (filter.status) {
      const hasError = trace.metrics.errorCount > 0;
      if (filter.status === 'error' && !hasError) return false;
      if (filter.status === 'success' && hasError) return false;
    }
    return true;
  });

  return (
    <div className="trace-list">
      {/* Filters */}
      <div className="trace-filters">
        <select
          value={filter.language}
          onChange={(e) => setFilter(f => ({ ...f, language: e.target.value }))}
          className="filter-select"
        >
          <option value="">All Languages</option>
          <option value="en">English</option>
          <option value="tr">Turkish</option>
          <option value="zh">Chinese</option>
        </select>

        <select
          value={filter.technique}
          onChange={(e) => setFilter(f => ({ ...f, technique: e.target.value }))}
          className="filter-select"
        >
          <option value="">All Techniques</option>
          <option value="memorization">Memorization</option>
          <option value="connection">Connection</option>
        </select>

        <select
          value={filter.status}
          onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="error">Has Errors</option>
        </select>
      </div>

      {/* Trace Items */}
      <div className="trace-items">
        {filteredTraces.map(trace => (
          <TraceListItem
            key={trace.id}
            trace={trace}
            isSelected={trace.id === selectedTraceId}
            onClick={() => onSelectTrace(trace.id)}
          />
        ))}

        {filteredTraces.length === 0 && (
          <div className="empty-state">
            No traces found. Generate a song to see traces here.
          </div>
        )}
      </div>

      <style jsx>{`
        .trace-list {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-secondary, #f8f9fa);
          border-radius: 8px;
          overflow: hidden;
        }

        .trace-filters {
          display: flex;
          gap: 8px;
          padding: 12px;
          background: var(--bg-primary, #fff);
          border-bottom: 1px solid var(--border-color, #e9ecef);
        }

        .filter-select {
          padding: 6px 10px;
          border: 1px solid var(--border-color, #e9ecef);
          border-radius: 4px;
          font-size: 13px;
          background: white;
        }

        .trace-items {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: var(--text-muted, #6c757d);
        }
      `}</style>
    </div>
  );
}

// Individual trace item
function TraceListItem({
  trace,
  isSelected,
  onClick,
}: {
  trace: Trace;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasError = trace.metrics.errorCount > 0;
  const isRunning = !trace.endTime;

  const statusColor = isRunning
    ? 'var(--status-running, #0d6efd)'
    : hasError
    ? 'var(--status-error, #dc3545)'
    : 'var(--status-success, #198754)';

  const formatDuration = (ms?: number) => {
    if (!ms) return '...';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`trace-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {/* Status indicator */}
      <div className="status-dot" style={{ background: statusColor }} />

      {/* Main content */}
      <div className="trace-content">
        <div className="trace-header">
          <span className="trace-topic">{trace.input.topic}</span>
          <span className="trace-time">{formatTime(trace.startTime)}</span>
        </div>

        <div className="trace-meta">
          <span className="meta-badge lang">{trace.input.language.toUpperCase()}</span>
          <span className="meta-badge tech">{trace.input.technique}</span>
          <span className="meta-value">{formatDuration(trace.durationMs)}</span>
          <span className="meta-value">{trace.metrics.totalTokens} tok</span>
        </div>
      </div>

      <style jsx>{`
        .trace-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          margin-bottom: 6px;
          background: var(--bg-primary, #fff);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 2px solid transparent;
        }

        .trace-item:hover {
          background: var(--bg-hover, #f1f3f4);
        }

        .trace-item.selected {
          border-color: var(--accent-color, #0d6efd);
          background: var(--bg-selected, #e7f1ff);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .trace-content {
          flex: 1;
          min-width: 0;
        }

        .trace-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 6px;
        }

        .trace-topic {
          font-weight: 500;
          font-size: 14px;
          color: var(--text-primary, #212529);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .trace-time {
          font-size: 12px;
          color: var(--text-muted, #6c757d);
          flex-shrink: 0;
        }

        .trace-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .meta-badge {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 500;
        }

        .meta-badge.lang {
          background: var(--badge-lang-bg, #e3f2fd);
          color: var(--badge-lang-color, #1565c0);
        }

        .meta-badge.tech {
          background: var(--badge-tech-bg, #f3e5f5);
          color: var(--badge-tech-color, #7b1fa2);
        }

        .meta-value {
          font-size: 12px;
          color: var(--text-muted, #6c757d);
        }
      `}</style>
    </div>
  );
}
