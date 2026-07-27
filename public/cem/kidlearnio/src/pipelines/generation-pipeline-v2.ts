/**
 * Generation Pipeline v2
 *
 * New architecture with:
 * - Strategist-first (single source of truth)
 * - Structured contracts between agents
 * - Parallel execution where possible
 * - Critic with retry loop
 *
 * Pipeline:
 * Strategist → [Context + Sticks + Coordinators] (parallel) → Lyrics → Critic → Style
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  GenerationInput,
  GenerationOutput,
  SupportedLanguage,
  PipelineStage,
  StructuredLyrics,
  CriticVerdict,
} from '@/types';
import { loadAgentDocumentsWithBrain } from '@/lib/document-loader';
import { processSticks, withCoordinatorOutputs } from '@/lib/stick-processor';
import { createCuriosityCoordinator } from '@/agents/curiosity-coordinator';
import { coordinateFlowGuidance } from '@/agents/song-flow-expert';
import { generateStyle, validateStylePrompt } from '@/agents/style-agent';
import { logPipelineRun } from '@/lib/agentic-logger';
import { startTour, endTour, printTourSummary } from '@humanitic/logic-sticks';
import {
  startTrace,
  endTrace,
  withObservation,
  storeTrace,
  type TraceEvent,
} from '@/lib/tracing';

// New v2 agents
import { createStrategy, validateStrategy } from '@/agents/strategist';
import { gatherContextV2 } from '@/agents/context-gatherer-v2';
import { generateLyricsV2 } from '@/agents/lyrics-agent-v2';
import { critiqueLyrics, shouldRetry, getVerdictSummary } from '@/agents/critic';

// ============================================================================
// TYPES
// ============================================================================

export type ProgressCallback = (stage: PipelineStage, details?: Record<string, unknown>) => void | Promise<void>;
export type TraceEventCallback = (event: TraceEvent) => void;

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Run the v2 generation pipeline with structured contracts.
 */
export async function runPipelineV2(
  input: GenerationInput,
  onProgress?: ProgressCallback,
  onTraceEvent?: TraceEventCallback
): Promise<GenerationOutput> {
  const sessionId = uuidv4();
  const startTime = Date.now();
  const language: SupportedLanguage = input.language ?? 'en';

  // Track partial results for fail-safe return
  let partialLyrics: string | undefined;
  let partialStyle: string | undefined;
  let partialTechnique: 'memorization' | 'connection' = input.technique;

  // Start trace
  startTrace({
    name: 'song-generation-v2',
    input: {
      topic: input.topic,
      language,
      ageRange: input.ageRange,
      technique: input.technique,
    },
    sessionId,
    onEvent: onTraceEvent,
  });

  try {
    // Token tracking
    startTour(`gen-${sessionId}`, 'kidlearnio');

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 1: Strategist (MUST be first - creates the contract)
    // ═══════════════════════════════════════════════════════════════════════
    await onProgress?.('GATHERING_CONTEXT', { substage: 'strategist' });

    const strategy = await withObservation(
      'strategist',
      {
        type: 'agent',
        input: { topic: input.topic, ageRange: input.ageRange, technique: input.technique },
        metadata: { role: 'planner', isContractCreator: true },
      },
      async (span) => {
        const result = await createStrategy({
          topic: input.topic,
          ageRange: input.ageRange,
          technique: input.technique,
          language,
          customInstructions: input.customInstructions,
        });

        // Validate strategy
        const issues = validateStrategy(result);
        span.update({
          metadata: {
            hookPhrase: result.hookPhrase,
            vocabularyCount: result.vocabularyAnchors.length,
            objectivesCount: result.learningObjectives.length,
            validationIssues: issues.length,
          },
        });

        return result;
      }
    );

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 2: Parallel Execution (Context + Sticks + Coordinators)
    // ═══════════════════════════════════════════════════════════════════════
    await onProgress?.('APPLYING_TECHNIQUE', { substage: 'parallel' });

    const docsWithBrain = await withObservation(
      'load-documents',
      { type: 'tool', input: { language }, metadata: { deterministic: false } },
      () => loadAgentDocumentsWithBrain(language)
    );

    // Run in parallel
    const [enrichedContext, stickResults, curiosityCoord, flowGuidance] = await Promise.all([
      // Context Gatherer (agent)
      withObservation(
        'context-gatherer-v2',
        {
          type: 'agent',
          input: { strategyId: strategy.id },
          metadata: { boundByStrategy: true },
        },
        async (span) => {
          const result = await gatherContextV2(strategy);
          span.update({
            metadata: {
              conceptCount: result.coreConcepts.length,
              vocabUsed: result.vocabularyUsed.length,
            },
          });
          return result;
        }
      ),

      // Logic Sticks (deterministic)
      withObservation(
        'logic-sticks',
        {
          type: 'tool',
          input: { language, ageRange: input.ageRange, technique: input.technique },
          metadata: { deterministic: true },
        },
        async () => processSticks(language, input.ageRange, input.technique, input.topic)
      ),

      // Curiosity Coordinator (scriptic)
      withObservation(
        'curiosity-coordinator',
        {
          type: 'coordinator',
          input: { strategyId: strategy.id },
          metadata: { scriptic: true },
        },
        async (span) => {
          const coordinator = createCuriosityCoordinator(input.ageRange, language);
          const result = coordinator.coordinate({
            topic: input.topic,
            ageRange: input.ageRange,
            language,
            coreConcepts: strategy.learningObjectives,
            keyFacts: strategy.vocabularyAnchors,
          });
          span.update({
            metadata: {
              hookType: result.primaryHook.type,
              triggerCount: result.triggers.length,
            },
          });
          return result;
        }
      ),

      // Flow Expert (hybrid)
      withObservation(
        'flow-expert',
        {
          type: 'coordinator',
          input: { strategyId: strategy.id },
          metadata: { hybrid: true },
        },
        async (span) => {
          const result = await coordinateFlowGuidance(
            input.topic,
            input.ageRange,
            strategy.technique,
            language,
            {
              coreConcepts: strategy.learningObjectives,
              keyFacts: strategy.vocabularyAnchors,
              realWorldConnections: [],
              complexityNotes: '',
              curiosityTriggers: [],
              ageAdaptations: {
                vocabularyLevel: strategy.ageConstraints.vocabularyLevel,
                sentenceMax: strategy.ageConstraints.maxWordsPerSentence,
                metaphorSources: strategy.ageConstraints.metaphorSources,
                complexity: strategy.ageConstraints.abstractionAllowed ? 'abstract_ok' : 'multi_step',
              },
            }
          );
          span.update({
            metadata: {
              targetDuration: result.constraints.duration.targetSeconds,
            },
          });
          return result;
        }
      ),
    ]);

    // Merge coordinator outputs into stick results
    const stickResultsWithCoordinators = withCoordinatorOutputs(stickResults, {
      curiosity: {
        coordinatorGuidance: curiosityCoord.coordinatorGuidance,
        primaryHookType: curiosityCoord.primaryHook.type,
      },
      flow: {
        coordinatorGuidance: flowGuidance.coordinatorGuidance,
        constraints: flowGuidance.constraints,
      },
    });

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 3: Lyrics Agent with Critic Retry Loop
    // ═══════════════════════════════════════════════════════════════════════
    await onProgress?.('GENERATING_LYRICS');

    let lyrics: StructuredLyrics | null = null;
    let verdict: CriticVerdict | null = null;
    let attemptNumber = 1;
    const maxAttempts = 3;

    while (attemptNumber <= maxAttempts) {
      // Generate lyrics
      lyrics = await withObservation(
        `lyrics-agent-attempt-${attemptNumber}`,
        {
          type: 'agent',
          input: {
            strategyId: strategy.id,
            attemptNumber,
            hasFeedback: !!verdict?.feedbackForRetry,
          },
          metadata: { attempt: attemptNumber, maxAttempts },
        },
        async (span) => {
          const result = await generateLyricsV2({
            strategy,
            context: enrichedContext,
            docs: docsWithBrain,
            stickResults: stickResultsWithCoordinators,
            retryFeedback: verdict?.feedbackForRetry,
            attemptNumber,
          });
          span.update({
            metadata: {
              sectionCount: result.sections.length,
              duration: result.estimatedDurationSeconds,
              hookCount: result.hookRepetitionCount,
            },
          });
          return result;
        }
      );

      // Run Critic
      verdict = await withObservation(
        `critic-attempt-${attemptNumber}`,
        {
          type: 'evaluator',
          input: { strategyId: strategy.id, attemptNumber },
          metadata: { reflection: true },
        },
        async (span) => {
          const result = await critiqueLyrics({
            strategy,
            lyrics: lyrics!,
            attemptNumber,
          });
          span.update({
            metadata: {
              pass: result.pass,
              score: result.score,
              errorCount: result.issues.filter(i => i.severity === 'error').length,
            },
          });
          return result;
        }
      );

      // Check if passed or should retry
      if (verdict.pass || !shouldRetry(verdict, maxAttempts)) {
        break;
      }

      attemptNumber++;
      await onProgress?.('GENERATING_LYRICS', { attempt: attemptNumber, feedback: verdict.feedbackForRetry });
    }

    // Log critic result
    console.log(`[Critic] ${getVerdictSummary(verdict!)}`);

    // Capture partial results for fail-safe return
    partialLyrics = lyrics?.rawLyrics;
    partialTechnique = strategy.technique;

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 4: Style Agent
    // ═══════════════════════════════════════════════════════════════════════
    await onProgress?.('GENERATING_STYLE');

    const style = await withObservation(
      'style-agent',
      {
        type: 'agent',
        input: { strategyId: strategy.id, technique: strategy.technique },
        metadata: {},
      },
      async (span) => {
        const result = await generateStyle(
          docsWithBrain,
          input.topic,
          strategy.technique,
          input.ageRange
        );
        const validation = validateStylePrompt(result);
        span.update({
          metadata: {
            styleValid: validation.valid,
            styleLength: result.length,
          },
        });
        return result;
      }
    );

    // Capture style for fail-safe return
    partialStyle = style;

    // ═══════════════════════════════════════════════════════════════════════
    // COMPLETE
    // ═══════════════════════════════════════════════════════════════════════
    await onProgress?.('COMPLETE');

    const durationMs = Date.now() - startTime;

    // End token tracking
    const tourSummary = endTour();
    if (tourSummary) {
      printTourSummary(tourSummary);
    }

    // Log to agentic stats
    logPipelineRun({
      topic: input.topic,
      language,
      technique: strategy.technique,
      ageRange: input.ageRange,
      durationMs,
      success: true,
      tokensEstimate: tourSummary?.totalTokens ?? 3000,
    });

    // End trace
    const completedTrace = endTrace({
      success: true,
      lyrics: lyrics?.rawLyrics,
      style,
    });
    storeTrace(completedTrace);

    return {
      success: true,
      lyrics: lyrics?.rawLyrics,
      style,
      metadata: {
        topic: input.topic,
        ageRange: input.ageRange,
        technique: strategy.technique,
        language,
        sessionId,
        timestamp: new Date().toISOString(),
        durationMs,
        traceId: completedTrace.id,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await onProgress?.('ERROR', { error: errorMessage });

    // Log failure
    logPipelineRun({
      topic: input.topic,
      language,
      technique: input.technique,
      ageRange: input.ageRange,
      durationMs: Date.now() - startTime,
      success: false,
      error: errorMessage,
    });

    // End trace with error
    const failedTrace = endTrace({
      success: false,
      error: errorMessage,
    });
    storeTrace(failedTrace);

    // FAIL-SAFE: Return partial results if we have them
    // Principle: Partial success is better than total failure
    return {
      success: false,
      lyrics: partialLyrics,  // May have lyrics even if later stage failed
      style: partialStyle,    // May have style even if something else failed
      metadata: {
        topic: input.topic,
        ageRange: input.ageRange,
        technique: partialTechnique,
        language,
        sessionId,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        traceId: failedTrace.id,
      },
      error: errorMessage,
    };
  }
}
