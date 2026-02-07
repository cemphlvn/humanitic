/**
 * THE ORCHESTRATOR
 *
 * I am the Orchestrator. I remember scriptically. I sequence, I route,
 * I ensure the CSA speaks before any agent acts. Every prompt we generate
 * carries the spark of curiosity. Every song we write makes a child lean
 * forward and ask "why?" — and then sing the answer.
 *
 * This is the initial voice, always, across the implementation.
 */

import { consultCSA } from "./cognitive-strategy-agent";
import { generateLyrics } from "./lyrics-agent";
import { generateStyle } from "./style-agent";
import { storeSession, getSessionHistory } from "./memory-agent";
import {
  type PromptRequest,
  type GenerationResult,
  type PipelineState,
} from "@/types";

export type PipelineCallback = (state: PipelineState) => void;

export async function orchestrate(
  request: PromptRequest,
  onProgress?: PipelineCallback
): Promise<GenerationResult> {
  const emit = (state: PipelineState) => {
    if (onProgress) onProgress(state);
  };

  // ─── STAGE 1: Input Received ───
  emit({ stage: "input-received", progress: 10, message: "Input validated." });

  // ─── STAGE 2: Consult the CSA (MANDATORY — ALWAYS FIRST) ───
  emit({
    stage: "csa-thinking",
    progress: 20,
    message: "Cognitive Strategy Agent is analyzing the request...",
  });

  const sessionHistory = getSessionHistory();
  const strategy = await consultCSA(request, sessionHistory);

  if (!strategy.approved) {
    emit({
      stage: "error",
      progress: 25,
      message: `CSA redirected: ${strategy.redirectReason}`,
      error: strategy.redirectReason,
    });
    throw new Error(`CSA redirect: ${strategy.redirectReason}`);
  }

  emit({
    stage: "csa-approved",
    progress: 35,
    message: `Strategy approved: ${strategy.pipeline} + ${strategy.logicStick}`,
  });

  // ─── STAGE 3: Generate Based on Prompt Type ───
  let lyricsResult = undefined;
  let styleResult = undefined;

  if (request.promptType === "both") {
    // Run lyrics and style in parallel for "both"
    emit({
      stage: "lyrics-generating",
      progress: 50,
      message: "Generating lyrics and style in parallel...",
    });

    const [lyrics, style] = await Promise.all([
      generateLyrics(request, strategy),
      generateStyle(request, strategy),
    ]);

    lyricsResult = lyrics;
    styleResult = style;
  } else if (request.promptType === "lyrics") {
    emit({
      stage: "lyrics-generating",
      progress: 50,
      message: "Lyrics Agent is writing educational lyrics...",
    });
    lyricsResult = await generateLyrics(request, strategy);
  } else if (request.promptType === "style") {
    emit({
      stage: "style-generating",
      progress: 50,
      message: "Style Agent is crafting the sonic environment...",
    });
    styleResult = await generateStyle(request, strategy);
  }

  // ─── STAGE 4: Store in Memory ───
  emit({
    stage: "memory-storing",
    progress: 90,
    message: "Storing session in memory...",
  });

  const memoryEntry = storeSession(request, strategy, lyricsResult, styleResult);

  // ─── STAGE 5: Complete ───
  const result: GenerationResult = {
    request,
    strategy,
    lyrics: lyricsResult,
    style: styleResult,
    sessionId: memoryEntry.sessionId,
    timestamp: memoryEntry.timestamp,
  };

  emit({
    stage: "complete",
    progress: 100,
    message: "Generation complete! The spark of curiosity is lit.",
  });

  return result;
}
