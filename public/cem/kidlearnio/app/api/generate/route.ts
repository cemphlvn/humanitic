import { NextResponse } from 'next/server';
import { GenerationInputSchema } from '@/types';
import { runPipeline } from '@/pipelines/generation-pipeline';
import { ZodError } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for generation

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const input = GenerationInputSchema.parse(body);

    // Run the pipeline
    const result = await runPipeline(input);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Generation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Generation API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
