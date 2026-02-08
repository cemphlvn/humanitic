import { GenerationInputSchema } from '@/types';
import { runPipeline } from '@/pipelines/generation-pipeline';
import type { TraceEvent } from '@/lib/tracing';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * SSE endpoint for streaming pipeline events in real-time.
 *
 * UX Pattern: Event-driven agent loops
 * - Treats agent interactions as event log, not mutable state
 * - Enables progressive disclosure of agent activity
 * - TTFT < 300ms: Client receives first event immediately
 */
export async function POST(request: Request) {
  const body = await request.json();

  // Validate input
  const parseResult = GenerationInputSchema.safeParse(body);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: parseResult.error.errors }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const input = parseResult.data;

  // Create readable stream for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial "thinking" event immediately (TTFT optimization)
      const thinkingEvent: TraceEvent = {
        type: 'trace:start',
        trace: {
          id: 'pending',
          name: 'song-generation',
          input: {
            topic: input.topic,
            language: input.language ?? 'en',
            ageRange: input.ageRange,
            technique: input.technique,
          },
          startTime: new Date().toISOString(),
        },
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(thinkingEvent)}\n\n`));

      try {
        // Run pipeline with event streaming
        const result = await runPipeline(
          input,
          undefined, // No progress callback needed - using trace events
          (event: TraceEvent) => {
            // Stream each trace event as SSE
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
        );

        // Send final result
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'result', data: result })}\n\n`)
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
