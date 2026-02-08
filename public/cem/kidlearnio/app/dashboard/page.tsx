'use client';

import { useState, useEffect } from 'react';
import { Dashboard } from '@/components/dashboard';
import type { Trace } from '@/lib/tracing/types';

/**
 * Dashboard Page — Agent Pipeline Observability
 *
 * Shows all traces with waterfall visualization.
 * Polls for updates every 3 seconds.
 */
export default function DashboardPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch traces on mount
  useEffect(() => {
    async function fetchTraces() {
      try {
        const res = await fetch('/api/traces?limit=50');
        if (!res.ok) throw new Error('Failed to fetch traces');
        const data = await res.json();
        setTraces(data.traces);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchTraces();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading traces...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            gap: 16px;
            color: #6b7280;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <i className="fas fa-exclamation-circle" />
        <h2>Error loading traces</h2>
        <p>{error}</p>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            gap: 12px;
            color: #dc2626;
          }
          .error-container i {
            font-size: 48px;
          }
          .error-container h2 {
            margin: 0;
            font-size: 20px;
          }
          .error-container p {
            color: #6b7280;
          }
        `}</style>
      </div>
    );
  }

  return <Dashboard initialTraces={traces} />;
}
