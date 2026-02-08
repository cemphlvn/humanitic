import { v4 as uuidv4 } from 'uuid';
import type {
  GenerationInput,
  GenerationOutput,
  PipelineState,
  PipelineStage,
  Technique,
  SupportedLanguage,
} from '@/types';
import { loadAgentDocumentsWithBrain } from '@/lib/document-loader';
import { gatherContext } from '@/agents/context-gatherer';
import { decideOnTechnique, runOrchestrator } from '@/agents/orchestrator';
import { generateLyrics } from '@/agents/lyrics-agent';
import { generateStyle, validateStylePrompt } from '@/agents/style-agent';
import { coordinateFlowGuidance } from '@/agents/song-flow-expert';
import { processSticks, withCoordinatorOutputs } from '@/lib/stick-processor';
import { createCuriosityCoordinator } from '@/agents/curiosity-coordinator';
import { logPipelineRun } from '@/lib/agentic-logger';
import { startTour, endTour, printTourSummary } from '@humanitic/logic-sticks';
import { validateAndFix } from '@/lib/lyrics-validator';
import {
  startTrace,
  endTrace,
  withObservation,
  storeTrace,
  type TraceEvent,
} from '@/lib/tracing';

/**
 * Progress callback type for real-time updates.
 */
export type ProgressCallback = (state: PipelineState) => void | Promise<void>;

/**
 * Trace event callback for real-time observability.
 */
export type TraceEventCallback = (event: TraceEvent) => void;

/**
 * Create initial pipeline state.
 */
function createInitialState(input: GenerationInput): PipelineState {
  const now = new Date().toISOString();
  return {
    stage: 'IDLE',
    topic: input.topic,
    ageRange: input.ageRange,
    technique: input.technique,
    startedAt: now,
    updatedAt: now,
  };
}

/**
 * Update pipeline state with new stage.
 */
function updateState(
  state: PipelineState,
  updates: Partial<PipelineState>
): PipelineState {
  return {
    ...state,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Run the complete generation pipeline with full tracing.
 */
export async function runPipeline(
  input: GenerationInput,
  onProgress?: ProgressCallback,
  onTraceEvent?: TraceEventCallback
): Promise<GenerationOutput> {
  const sessionId = uuidv4();
  const startTime = Date.now();
  const language: SupportedLanguage = input.language ?? 'en';

  let state = createInitialState(input);

  const emitProgress = async (newState: PipelineState) => {
    state = newState;
    if (onProgress) {
      await onProgress(state);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // START TRACE — Root observation for entire pipeline
  // ═══════════════════════════════════════════════════════════════════════════
  startTrace({
    name: 'song-generation',
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
    // TOKEN TRACKING: Start tour for this generation
    startTour(`gen-${sessionId}`, 'kidlearnio');

    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE: Load Documents (Tool)
    // ═══════════════════════════════════════════════════════════════════════════
    const docsWithBrain = await withObservation(
      'load-documents',
      {
        type: 'tool',
        input: { language },
        metadata: { stage: 'setup' },
      },
      async () => {
        return loadAgentDocumentsWithBrain(language);
      }
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE: Process Sticks (Tool - Deterministic)
    // ═══════════════════════════════════════════════════════════════════════════
    const stickResults = await withObservation(
      'logic-sticks',
      {
        type: 'tool',
        input: { language, ageRange: input.ageRange, technique: input.technique, topic: input.topic },
        metadata: { deterministic: true },
      },
      async () => {
        return processSticks(language, input.ageRange, input.technique, input.topic);
      }
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE 1: Gather Context (Agent)
    // ═══════════════════════════════════════════════════════════════════════════
    await emitProgress(updateState(state, { stage: 'GATHERING_CONTEXT' }));

    const context = await withObservation(
      'context-gatherer',
      {
        type: 'agent',
        input: { topic: input.topic, ageRange: input.ageRange },
        metadata: { stage: 'GATHERING_CONTEXT' },
      },
      async (span) => {
        const result = await gatherContext(input.topic, input.ageRange);
        span.update({
          metadata: {
            conceptCount: result.coreConcepts.length,
            factCount: result.keyFacts.length,
          },
        });
        return result;
      }
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE: Curiosity Coordinator (Coordinator - Scriptic)
    // ═══════════════════════════════════════════════════════════════════════════
    const curiosityCoordination = await withObservation(
      'curiosity-coordinator',
      {
        type: 'coordinator',
        input: { topic: input.topic, ageRange: input.ageRange, language },
        metadata: { scriptic: true },
      },
      async (span) => {
        const coordinator = createCuriosityCoordinator(input.ageRange, language);
        const result = coordinator.coordinate({
          topic: input.topic,
          ageRange: input.ageRange,
          language,
          coreConcepts: context.coreConcepts,
          keyFacts: context.keyFacts,
        });
        span.update({
          metadata: {
            hookType: result.primaryHook.type,
            triggerCount: result.triggers.length,
          },
        });
        return result;
      }
    );

    // Merge coordinator outputs into stick results
    const stickResultsWithCoordinators = withCoordinatorOutputs(stickResults, {
      curiosity: {
        coordinatorGuidance: curiosityCoordination.coordinatorGuidance,
        primaryHookType: curiosityCoordination.primaryHook.type,
      },
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE 2: Decide on Technique (Agent)
    // ═══════════════════════════════════════════════════════════════════════════
    await emitProgress(updateState(state, { stage: 'APPLYING_TECHNIQUE', context }));

    const decision = await withObservation(
      'technique-decision',
      {
        type: 'agent',
        input: { topic: input.topic, ageRange: input.ageRange },
        metadata: { stage: 'APPLYING_TECHNIQUE' },
      },
      async (span) => {
        const result = await decideOnTechnique(docsWithBrain, input.topic, input.ageRange);
        span.update({
          metadata: {
            technique: result.technique,
            curiosityTechnique: result.curiosityTechnique,
          },
        });
        return result;
      }
    );

    // Use user's preference or agent's decision
    const finalTechnique: Technique =
      input.technique !== decision.technique
        ? input.technique // User override
        : decision.technique;

    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE 2.5: Flow Guidance (Coordinator - Hybrid)
    // ═══════════════════════════════════════════════════════════════════════════
    await emitProgress(updateState(state, { stage: 'GENERATING_FLOW_GUIDANCE', technique: finalTechnique }));

    const flowGuidance = await withObservation(
      'flow-expert',
      {
        type: 'coordinator',
        input: { topic: input.topic, ageRange: input.ageRange, technique: finalTechnique, language },
        metadata: { stage: 'GENERATING_FLOW_GUIDANCE', hybrid: true },
      },
      async (span) => {
        const result = await coordinateFlowGuidance(
          input.topic,
          input.ageRange,
          finalTechnique,
          language,
          context
        );
        span.update({
          metadata: {
            hookCandidates: result.suggestions.hookPhraseCandidates.length,
            targetDuration: result.constraints.duration.targetSeconds,
          },
        });
        return result;
      }
    );

    // Merge flow guidance into coordinator outputs
    const stickResultsWithAllCoordinators = withCoordinatorOutputs(stickResultsWithCoordinators, {
      flow: {
        coordinatorGuidance: flowGuidance.coordinatorGuidance,
        constraints: flowGuidance.constraints,
      },
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE 3: Generate Lyrics (Agent)
    // ═══════════════════════════════════════════════════════════════════════════
    let lyrics: string | undefined;
    if (input.outputType === 'lyrics' || input.outputType === 'both') {
      await emitProgress(updateState(state, { stage: 'GENERATING_LYRICS', technique: finalTechnique }));

      lyrics = await withObservation(
        'lyrics-agent',
        {
          type: 'agent',
          input: {
            technique: finalTechnique,
            ageRange: input.ageRange,
            curiosityTechnique: decision.curiosityTechnique,
            language,
          },
          metadata: { stage: 'GENERATING_LYRICS' },
        },
        async () => {
          return generateLyrics(
            docsWithBrain,
            context,
            finalTechnique,
            input.ageRange,
            decision.curiosityTechnique,
            stickResultsWithAllCoordinators
          );
        }
      );

      // ═══════════════════════════════════════════════════════════════════════════
      // STAGE 3.5: Validate Lyrics (Evaluator - Deterministic + Micro-fixes)
      // ═══════════════════════════════════════════════════════════════════════════
      const validationResult = await withObservation(
        'lyrics-validator',
        {
          type: 'evaluator',
          input: { lyrics, language, topic: input.topic },
          metadata: { deterministic: true, autoFix: true },
        },
        async (span) => {
          const result = await validateAndFix(lyrics!, language, input.topic, true);
          span.update({
            metadata: {
              isValid: result.validation.isValid,
              issueCount: result.validation.issues.length,
              wasFixed: result.wasFixed,
              circuitOpen: result.circuitOpen,
            },
          });
          return result;
        }
      );

      lyrics = validationResult.lyrics;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE 4: Generate Style (Agent)
    // ═══════════════════════════════════════════════════════════════════════════
    let style: string | undefined;
    if (input.outputType === 'style' || input.outputType === 'both') {
      await emitProgress(updateState(state, { stage: 'GENERATING_STYLE', lyrics }));

      style = await withObservation(
        'style-agent',
        {
          type: 'agent',
          input: { topic: input.topic, technique: finalTechnique, ageRange: input.ageRange },
          metadata: { stage: 'GENERATING_STYLE' },
        },
        async (span) => {
          const result = await generateStyle(docsWithBrain, input.topic, finalTechnique, input.ageRange);

          // Validate style
          const validation = validateStylePrompt(result);
          span.update({
            metadata: {
              styleValid: validation.valid,
              styleIssues: validation.issues,
            },
          });

          return result;
        }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE 5: Store to Memory
    // ═══════════════════════════════════════════════════════════════════════════
    await emitProgress(updateState(state, { stage: 'STORING_MEMORY', lyrics, style }));

    // TODO: Implement Cognee memory storage
    const memoryId = sessionId;

    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE 6: Complete
    // ═══════════════════════════════════════════════════════════════════════════
    await emitProgress(updateState(state, { stage: 'COMPLETE', memoryId }));

    const durationMs = Date.now() - startTime;

    // TOKEN TRACKING: End tour and print summary
    const tourSummary = endTour();
    if (tourSummary) {
      printTourSummary(tourSummary);
    }

    // Log to agentic stats (Truth Technician Level 2)
    logPipelineRun({
      topic: input.topic,
      language,
      technique: finalTechnique,
      ageRange: input.ageRange,
      durationMs,
      success: true,
      tokensEstimate: tourSummary?.totalTokens ?? 2500,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // END TRACE — Store completed trace
    // ═══════════════════════════════════════════════════════════════════════════
    const completedTrace = endTrace({
      success: true,
      lyrics,
      style,
    });
    storeTrace(completedTrace);

    return {
      success: true,
      lyrics,
      style,
      metadata: {
        topic: input.topic,
        ageRange: input.ageRange,
        technique: finalTechnique,
        language,
        sessionId,
        timestamp: new Date().toISOString(),
        durationMs,
        traceId: completedTrace.id, // Include trace ID for dashboard link
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await emitProgress(updateState(state, { stage: 'ERROR', error: errorMessage }));

    // Log failure to agentic stats
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

    return {
      success: false,
      metadata: {
        topic: input.topic,
        ageRange: input.ageRange,
        technique: input.technique,
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

/**
 * Run pipeline with full orchestration (single-shot mode).
 * Uses the orchestrator to run everything in one Claude call.
 */
export async function runPipelineSingleShot(
  input: GenerationInput
): Promise<GenerationOutput> {
  const sessionId = uuidv4();
  const startTime = Date.now();
  const language: SupportedLanguage = input.language ?? 'en';

  try {
    const docsWithBrain = await loadAgentDocumentsWithBrain(language);
    const result = await runOrchestrator(docsWithBrain, input);

    return {
      success: true,
      lyrics: result.lyrics,
      style: result.style,
      metadata: {
        topic: input.topic,
        ageRange: input.ageRange,
        technique: result.technique,
        language,
        sessionId,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      metadata: {
        topic: input.topic,
        ageRange: input.ageRange,
        technique: input.technique,
        language,
        sessionId,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get human-readable stage description.
 */
export function getStageDescription(stage: PipelineStage): string {
  const descriptions: Record<PipelineStage, string> = {
    IDLE: 'Ready to start',
    GATHERING_CONTEXT: 'Gathering educational context...',
    APPLYING_TECHNIQUE: 'Applying learning technique...',
    GENERATING_FLOW_GUIDANCE: 'Crafting song flow...',
    GENERATING_LYRICS: 'Writing song lyrics...',
    GENERATING_STYLE: 'Crafting music style...',
    STORING_MEMORY: 'Saving to memory...',
    COMPLETE: 'Generation complete!',
    ERROR: 'An error occurred',
  };

  return descriptions[stage];
}
