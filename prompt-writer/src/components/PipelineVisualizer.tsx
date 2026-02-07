"use client";

import type { PipelineStage } from "@/types";

interface PipelineVisualizerProps {
  currentStage: PipelineStage;
}

const STAGES: { key: PipelineStage[]; label: string; icon: string }[] = [
  { key: ["input-received"], label: "Input", icon: "fa-pen" },
  { key: ["csa-thinking", "csa-approved"], label: "CSA", icon: "fa-brain" },
  { key: ["lyrics-generating"], label: "Lyrics", icon: "fa-music" },
  { key: ["style-generating"], label: "Style", icon: "fa-palette" },
  { key: ["memory-storing"], label: "Memory", icon: "fa-database" },
];

const STAGE_ORDER: PipelineStage[] = [
  "idle",
  "input-received",
  "csa-thinking",
  "csa-approved",
  "lyrics-generating",
  "style-generating",
  "memory-storing",
  "complete",
];

function getStageIndex(stage: PipelineStage): number {
  return STAGE_ORDER.indexOf(stage);
}

function getDotState(
  stageKeys: PipelineStage[],
  currentStage: PipelineStage
): "pending" | "active" | "complete" | "error" {
  if (currentStage === "error") return "error";
  if (currentStage === "complete") return "complete";

  const currentIndex = getStageIndex(currentStage);
  const stageIndices = stageKeys.map(getStageIndex);
  const maxStageIndex = Math.max(...stageIndices);
  const minStageIndex = Math.min(...stageIndices);

  if (stageKeys.includes(currentStage)) return "active";
  if (currentIndex > maxStageIndex) return "complete";
  if (currentIndex < minStageIndex) return "pending";
  return "pending";
}

export default function PipelineVisualizer({
  currentStage,
}: PipelineVisualizerProps) {
  return (
    <div className="card shadow-2 mb-4">
      <div className="card-body py-3">
        <div className="pipeline-stepper">
          {STAGES.map((stage, idx) => {
            const state = getDotState(stage.key, currentStage);
            return (
              <div key={stage.label} className="pipeline-step">
                <div className="text-center">
                  <div className={`pipeline-dot ${state}`}>
                    {state === "complete" ? (
                      <i className="fas fa-check fa-xs" />
                    ) : state === "error" ? (
                      <i className="fas fa-times fa-xs" />
                    ) : (
                      <i className={`fas ${stage.icon} fa-xs`} />
                    )}
                  </div>
                  <div className="pipeline-label">{stage.label}</div>
                </div>
                {idx < STAGES.length - 1 && (
                  <div
                    className={`pipeline-connector ${state === "complete" ? "complete" : ""}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
