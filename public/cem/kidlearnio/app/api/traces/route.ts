import { NextResponse } from 'next/server';
import { listTraces, getTrace } from '@/lib/tracing';

/**
 * GET /api/traces — List all traces or get single trace
 *
 * Query params:
 * - id: Get specific trace by ID
 * - limit: Max traces to return (default 50)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const traceId = searchParams.get('id');
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  try {
    if (traceId) {
      // Get single trace
      const trace = getTrace(traceId);
      if (!trace) {
        return NextResponse.json(
          { error: 'Trace not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ trace });
    }

    // List all traces
    const traces = listTraces(limit);
    return NextResponse.json({ traces });
  } catch (error) {
    console.error('[API] Error fetching traces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traces' },
      { status: 500 }
    );
  }
}
