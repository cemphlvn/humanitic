'use client';

/**
 * Dashboard — Agent Pipeline Observability
 *
 * UX Principles Applied:
 * 1. OVERVIEW FIRST: Summary metrics visible immediately
 * 2. DRILL DOWN: Click trace to see details
 * 3. REAL-TIME: Live updates during generation
 * 4. CONTEXTUAL: Show what matters for debugging
 */

import { useState, useEffect } from 'react';
import { TraceList } from './TraceList';
import { TraceDetail } from './TraceDetail';
import type { Trace, TraceSummary } from '@/lib/tracing/types';

interface DashboardProps {
  initialTraces?: Trace[];
}

export function Dashboard({ initialTraces = [] }: DashboardProps) {
  const [traces, setTraces] = useState<Trace[]>(initialTraces);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const selectedTrace = traces.find(t => t.id === selectedTraceId);

  // Calculate summary metrics
  const summary = calculateSummary(traces);

  // Poll for new traces (or use SSE in production)
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/traces');
        const data = await res.json();
        setTraces(data.traces);
      } catch (e) {
        console.error('Failed to fetch traces:', e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <i className="fas fa-chart-line" />
            Pipeline Observatory
          </h1>
          <button
            className={`live-toggle ${isLive ? 'active' : ''}`}
            onClick={() => setIsLive(!isLive)}
          >
            <span className="live-dot" />
            {isLive ? 'Live' : 'Paused'}
          </button>
        </div>
      </header>

      {/* Summary Metrics */}
      <div className="summary-row">
        <SummaryCard
          icon="fa-layer-group"
          label="Total Traces"
          value={summary.totalTraces.toString()}
        />
        <SummaryCard
          icon="fa-check-circle"
          label="Success Rate"
          value={`${(summary.successRate * 100).toFixed(1)}%`}
          color={summary.successRate > 0.9 ? 'green' : summary.successRate > 0.7 ? 'yellow' : 'red'}
        />
        <SummaryCard
          icon="fa-clock"
          label="Avg Duration"
          value={formatDuration(summary.avgDurationMs)}
        />
        <SummaryCard
          icon="fa-coins"
          label="Avg Tokens"
          value={Math.round(summary.avgTokens).toLocaleString()}
        />
        <SummaryCard
          icon="fa-dollar-sign"
          label="Total Cost"
          value={`$${summary.totalCostUsd.toFixed(4)}`}
        />
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Trace List (Left Panel) */}
        <div className="list-panel">
          <TraceList
            traces={traces}
            selectedTraceId={selectedTraceId ?? undefined}
            onSelectTrace={setSelectedTraceId}
          />
        </div>

        {/* Trace Detail (Right Panel) */}
        <div className="detail-panel">
          {selectedTrace ? (
            <TraceDetail trace={selectedTrace} />
          ) : (
            <div className="empty-detail">
              <i className="fas fa-mouse-pointer fa-3x" />
              <p>Select a trace to view details</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f5f5f5;
        }

        .dashboard-header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 16px 24px;
          color: white;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .live-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 20px;
          background: transparent;
          color: white;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .live-toggle:hover {
          background: rgba(255,255,255,0.1);
        }

        .live-toggle.active {
          background: rgba(34, 197, 94, 0.2);
          border-color: #22c55e;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6b7280;
        }

        .live-toggle.active .live-dot {
          background: #22c55e;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .summary-row {
          display: flex;
          gap: 16px;
          padding: 20px 24px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          overflow-x: auto;
        }

        .main-content {
          flex: 1;
          display: flex;
          gap: 0;
          overflow: hidden;
        }

        .list-panel {
          width: 400px;
          min-width: 300px;
          border-right: 1px solid #e5e7eb;
          background: white;
        }

        .detail-panel {
          flex: 1;
          background: white;
          overflow: hidden;
        }

        .empty-detail {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #9ca3af;
          gap: 16px;
        }

        .empty-detail p {
          margin: 0;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

// Summary card component
function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color?: 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444',
  };

  return (
    <div className="summary-card">
      <i className={`fas ${icon}`} style={{ color: color ? colorClasses[color] : '#6b7280' }} />
      <div className="card-content">
        <div className="card-value" style={{ color: color ? colorClasses[color] : '#111827' }}>
          {value}
        </div>
        <div className="card-label">{label}</div>
      </div>

      <style jsx>{`
        .summary-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #f9fafb;
          border-radius: 8px;
          min-width: 140px;
        }

        .summary-card i {
          font-size: 20px;
        }

        .card-content {
          display: flex;
          flex-direction: column;
        }

        .card-value {
          font-size: 18px;
          font-weight: 600;
        }

        .card-label {
          font-size: 12px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

// Calculate summary from traces
function calculateSummary(traces: Trace[]): TraceSummary {
  if (traces.length === 0) {
    return {
      totalTraces: 0,
      successRate: 1,
      avgDurationMs: 0,
      avgTokens: 0,
      totalCostUsd: 0,
      byLanguage: {},
      byTechnique: {},
      errorsByAgent: {},
    };
  }

  const successful = traces.filter(t => t.output?.success);
  const totalDuration = traces.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
  const totalTokens = traces.reduce((sum, t) => sum + t.metrics.totalTokens, 0);
  const totalCost = traces.reduce((sum, t) => sum + t.metrics.totalCostUsd, 0);

  const byLanguage: Record<string, number> = {};
  const byTechnique: Record<string, number> = {};

  traces.forEach(t => {
    byLanguage[t.input.language] = (byLanguage[t.input.language] ?? 0) + 1;
    byTechnique[t.input.technique] = (byTechnique[t.input.technique] ?? 0) + 1;
  });

  return {
    totalTraces: traces.length,
    successRate: successful.length / traces.length,
    avgDurationMs: totalDuration / traces.length,
    avgTokens: totalTokens / traces.length,
    totalCostUsd: totalCost,
    byLanguage,
    byTechnique,
    errorsByAgent: {},
  };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
