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
import { processSticks, withCoordinatorOutputs } from '@/lib/stick-processor';
import { createCuriosityCoordinator } from '@/agents/curiosity-coordinator';
import { logPipelineRun } from '@/lib/agentic-logger';
import { startTour, endTour, printTourSummary } from '@humanitic/logic-sticks';

/**
 * Progress callback type for real-time updates.
 */
export type ProgressCallback = (state: PipelineState) => void | Promise<void>;

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
 * Run the complete generation pipeline.
 */
export async function runPipeline(
  input: GenerationInput,
  onProgress?: ProgressCallback
): Promise<GenerationOutput> {
  const sessionId = uuidv4();
  const startTime = Date.now();

  let state = createInitialState(input);

  const emitProgress = async (newState: PipelineState) => {
    state = newState;
    if (onProgress) {
      await onProgress(state);
    }
  };

  try {
    // TOKEN TRACKING: Start tour for this generation
    startTour(`gen-${sessionId}`, 'kidlearnio');

    // ENFORCEMENT: Load agent documents WITH language brain
    // Language brain MUST be loaded before lyrics generation (Brains Before Mouths)
    const language: SupportedLanguage = input.language ?? 'en';
    const docsWithBrain = await loadAgentDocumentsWithBrain(language);

    // LOGIC STICKS: Pre-compute deterministic transformations
    // This happens BEFORE Claude calls — sticks handle predictable, Claude handles creative
    const stickResults = processSticks(language, input.ageRange, input.technique, input.topic);
    console.log('[Pipeline] Logic sticks applied:', {
      vocabulary: stickResults.ageAdaptation.vocabularyLevel,
      structure: stickResults.structure.sections.length + ' sections',
      language: stickResults.languageRouting.language,
      curiosityTriggers: stickResults.curiosity.recommendedTriggers.join(', '),
    });

    // Stage 1: Gathering Context
    await emitProgress(updateState(state, { stage: 'GATHERING_CONTEXT' }));
    const context = await gatherContext(input.topic, input.ageRange);

    // MULTI-ORCHESTRATOR: Curiosity Coordinator
    // Each domain has its own coordinator managing its sticks
    const curiosityCoordinator = createCuriosityCoordinator(input.ageRange, language);
    const curiosityCoordination = curiosityCoordinator.coordinate({
      topic: input.topic,
      ageRange: input.ageRange,
      language,
      coreConcepts: context.coreConcepts,
      keyFacts: context.keyFacts,
    });
    console.log('[Pipeline] Curiosity coordinated:', {
      hookType: curiosityCoordination.primaryHook.type,
      triggerCount: curiosityCoordination.triggers.length,
    });

    // Merge coordinator outputs into stick results
    const stickResultsWithCoordinators = withCoordinatorOutputs(stickResults, {
      curiosity: {
        coordinatorGuidance: curiosityCoordination.coordinatorGuidance,
        primaryHookType: curiosityCoordination.primaryHook.type,
      },
    });

    // Stage 2: Decide on Technique (if not specified or to confirm)
    await emitProgress(
      updateState(state, {
        stage: 'APPLYING_TECHNIQUE',
        context,
      })
    );

    const decision = await decideOnTechnique(
      docsWithBrain,
      input.topic,
      input.ageRange
    );

    // Use user's preference or agent's decision
    const finalTechnique: Technique =
      input.technique !== decision.technique
        ? input.technique // User override
        : decision.technique;

    // Stage 3: Generate Lyrics (with language brain enforcement)
    let lyrics: string | undefined;
    if (input.outputType === 'lyrics' || input.outputType === 'both') {
      await emitProgress(
        updateState(state, {
          stage: 'GENERATING_LYRICS',
          technique: finalTechnique,
        })
      );

      // ENFORCEMENT: generateLyrics requires docsWithBrain (includes language brain)
      // Pass stickResults with coordinator outputs for pre-computed guidance
      lyrics = await generateLyrics(
        docsWithBrain,
        context,
        finalTechnique,
        input.ageRange,
        decision.curiosityTechnique,
        stickResultsWithCoordinators
      );
    }

    // Stage 4: Generate Style
    let style: string | undefined;
    if (input.outputType === 'style' || input.outputType === 'both') {
      await emitProgress(
        updateState(state, {
          stage: 'GENERATING_STYLE',
          lyrics,
        })
      );

      style = await generateStyle(
        docsWithBrain,
        input.topic,
        finalTechnique,
        input.ageRange
      );

      // Validate style
      const validation = validateStylePrompt(style);
      if (!validation.valid) {
        console.warn('Style validation issues:', validation.issues);
      }
    }

    // Stage 5: Store to Memory (placeholder - Cognee integration)
    await emitProgress(
      updateState(state, {
        stage: 'STORING_MEMORY',
        lyrics,
        style,
      })
    );

    // TODO: Implement Cognee memory storage
    const memoryId = sessionId; // Placeholder

    // Stage 6: Complete
    await emitProgress(
      updateState(state, {
        stage: 'COMPLETE',
        memoryId,
      })
    );

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
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await emitProgress(
      updateState(state, {
        stage: 'ERROR',
        error: errorMessage,
      })
    );

    // Log failure to agentic stats
    logPipelineRun({
      topic: input.topic,
      language: input.language ?? 'en',
      technique: input.technique,
      ageRange: input.ageRange,
      durationMs: Date.now() - startTime,
      success: false,
      error: errorMessage,
    });

    return {
      success: false,
      metadata: {
        topic: input.topic,
        ageRange: input.ageRange,
        technique: input.technique,
        language: input.language ?? 'en',
        sessionId,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
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
    GENERATING_LYRICS: 'Writing song lyrics...',
    GENERATING_STYLE: 'Crafting music style...',
    STORING_MEMORY: 'Saving to memory...',
    COMPLETE: 'Generation complete!',
    ERROR: 'An error occurred',
  };

  return descriptions[stage];
}
