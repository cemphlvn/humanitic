"use client";

import { useState } from "react";
import type {
  PromptRequest,
  AgeGroup,
  PromptType,
  LearningApproach,
  GenerationResult,
  PipelineStage,
} from "@/types";
import PipelineVisualizer from "./PipelineVisualizer";
import CSAStrategyCard from "./CSAStrategyCard";
import LyricsOutputDisplay from "./LyricsOutput";
import StyleOutputDisplay from "./StyleOutput";

export default function PromptGenerator() {
  // ─── Form State ───
  const [subject, setSubject] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("K-6");
  const [promptType, setPromptType] = useState<PromptType>("both");
  const [learningApproach, setLearningApproach] =
    useState<LearningApproach>("six-layer-andragogy");
  const [additionalContext, setAdditionalContext] = useState("");

  // ─── Pipeline State ───
  const [loading, setLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setPipelineStage("input-received");

    const request: PromptRequest = {
      subject,
      ageGroup,
      promptType,
      learningApproach,
      additionalContext: additionalContext || undefined,
    };

    try {
      setPipelineStage("csa-thinking");

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Generation failed");
      }

      const data: GenerationResult = await response.json();
      setResult(data);
      setPipelineStage("complete");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setPipelineStage("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Pipeline Visualization */}
      {pipelineStage !== "idle" && (
        <PipelineVisualizer currentStage={pipelineStage} />
      )}

      <div className="row g-4">
        {/* ─── INPUT PANEL ─── */}
        <div className="col-lg-5">
          <div className="card shadow-3">
            <div className="card-body p-4">
              <h5 className="card-title mb-4">
                <i
                  className="fas fa-wand-magic-sparkles me-2"
                  style={{ color: "var(--pw-primary)" }}
                />
                Generate Prompt
              </h5>

              {/* Subject */}
              <div className="form-outline mb-4">
                <input
                  type="text"
                  id="subject"
                  className="form-control"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Photosynthesis, Multiplication Tables, Water Cycle"
                  required
                />
                <label className="form-label" htmlFor="subject">
                  Subject / Topic
                </label>
              </div>

              {/* Age Group */}
              <div className="mb-4">
                <label className="form-label fw-bold" style={{ fontSize: "0.85rem" }}>
                  Age Group
                </label>
                <select
                  className="form-select"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                >
                  <option value="K-6">K-6 (Early childhood)</option>
                  <option value="7-12">7-12 (Middle school)</option>
                  <option value="13-18">13-18 (High school)</option>
                  <option value="18-24">18-24 (Higher education)</option>
                </select>
              </div>

              {/* Prompt Type */}
              <div className="mb-4">
                <label className="form-label fw-bold" style={{ fontSize: "0.85rem" }}>
                  Prompt Type
                </label>
                <div>
                  {(["lyrics", "style", "both"] as PromptType[]).map((pt) => (
                    <div key={pt} className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="promptType"
                        id={`pt-${pt}`}
                        value={pt}
                        checked={promptType === pt}
                        onChange={() => setPromptType(pt)}
                      />
                      <label className="form-check-label" htmlFor={`pt-${pt}`}>
                        {pt.charAt(0).toUpperCase() + pt.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Learning Approach */}
              <div className="mb-4">
                <label className="form-label fw-bold" style={{ fontSize: "0.85rem" }}>
                  Learning Approach
                </label>
                <div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="approach"
                      id="approach-memo"
                      checked={learningApproach === "memorization"}
                      onChange={() => setLearningApproach("memorization")}
                    />
                    <label className="form-check-label" htmlFor="approach-memo">
                      <strong>Memorization</strong>
                      <small className="d-block text-muted">
                        Acronyms, rhyme chains, counting songs
                      </small>
                    </label>
                  </div>
                  <div className="form-check mt-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="approach"
                      id="approach-six"
                      checked={learningApproach === "six-layer-andragogy"}
                      onChange={() => setLearningApproach("six-layer-andragogy")}
                    />
                    <label className="form-check-label" htmlFor="approach-six">
                      <strong>6-Layer Andragogy</strong>
                      <small className="d-block text-muted">
                        Connection-building, deep understanding
                      </small>
                    </label>
                  </div>
                </div>
              </div>

              {/* Additional Context */}
              <div className="form-outline mb-4">
                <textarea
                  className="form-control"
                  id="context"
                  rows={3}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Any specific focus, prior knowledge, or constraints..."
                />
                <label className="form-label" htmlFor="context">
                  Additional Context (optional)
                </label>
              </div>

              {/* Generate Button */}
              <button
                className="btn btn-generate text-white w-100 btn-lg"
                onClick={handleGenerate}
                disabled={loading || !subject.trim()}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sparkles me-2" />
                    Generate Suno Prompt
                  </>
                )}
              </button>

              {/* Error Display */}
              {error && (
                <div className="alert alert-danger mt-3 mb-0" role="alert">
                  <i className="fas fa-exclamation-triangle me-2" />
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── OUTPUT PANEL ─── */}
        <div className="col-lg-7">
          {!result && pipelineStage === "idle" && (
            <div className="card shadow-1 h-100">
              <div className="card-body d-flex flex-column align-items-center justify-content-center text-center p-5">
                <i
                  className="fas fa-music fa-3x mb-3"
                  style={{ color: "#e0e0e0" }}
                />
                <h5 className="text-muted">Ready to Spark Curiosity</h5>
                <p className="text-muted mb-0" style={{ maxWidth: 400 }}>
                  Enter a subject and let the Cognitive Strategy Agent design the
                  perfect educational song prompt for Suno AI.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="card shadow-1">
              <div className="card-body d-flex flex-column align-items-center justify-content-center p-5">
                <div className="spinner-border" style={{ color: "var(--pw-primary)" }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">
                  {pipelineStage === "csa-thinking" &&
                    "Cognitive Strategy Agent is analyzing..."}
                  {pipelineStage === "lyrics-generating" &&
                    "Lyrics Agent is writing educational lyrics..."}
                  {pipelineStage === "style-generating" &&
                    "Style Agent is crafting the sonic environment..."}
                  {pipelineStage === "memory-storing" &&
                    "Storing session in memory..."}
                </p>
              </div>
            </div>
          )}

          {result && (
            <div>
              {/* CSA Strategy Card */}
              <CSAStrategyCard strategy={result.strategy} />

              {/* Lyrics Output */}
              {result.lyrics && <LyricsOutputDisplay lyrics={result.lyrics} />}

              {/* Style Output */}
              {result.style && <StyleOutputDisplay style={result.style} />}

              {/* Session Info */}
              <div className="text-center">
                <small className="text-muted">
                  Session: {result.sessionId} | {new Date(result.timestamp).toLocaleString()}
                </small>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
