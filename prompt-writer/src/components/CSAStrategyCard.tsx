"use client";

import type { CSAStrategy, ThoughtPipeline, LogicStick, CuriosityTechnique } from "@/types";

interface CSAStrategyCardProps {
  strategy: CSAStrategy;
}

const PIPELINE_LABELS: Record<ThoughtPipeline, string> = {
  "wonder-question-discovery": "Wonder → Question → Discovery",
  "pattern-rhythm-recall": "Pattern → Rhythm → Recall",
  "story-character-lesson": "Story → Character → Lesson",
  "connect-layer-integrate": "Connect → Layer → Integrate",
  "play-explore-build": "Play → Explore → Build",
};

const STICK_LABELS: Record<LogicStick, string> = {
  ladder: "The Ladder",
  mirror: "The Mirror",
  zoom: "The Zoom",
  anchor: "The Anchor",
  "rhythm-lock": "The Rhythm Lock",
  web: "The Web",
};

const CURIOSITY_LABELS: Record<CuriosityTechnique, string> = {
  "impossible-fact": "The Impossible Fact",
  "unanswered-question": "The Unanswered Question",
  "personal-stake": "The Personal Stake",
  "pattern-reveal": "The Pattern Reveal",
  "wrong-answer": "The Wrong Answer",
  "tiny-giant": "The Tiny Giant",
  "time-machine": "The Time Machine",
};

export default function CSAStrategyCard({ strategy }: CSAStrategyCardProps) {
  return (
    <div className="card card-csa shadow-2 mb-4 slide-in-left">
      <div className="card-body">
        <h6 className="card-title d-flex align-items-center mb-3">
          <i
            className="fas fa-brain me-2"
            style={{ color: "var(--pw-csa)" }}
          />
          <span style={{ color: "var(--pw-csa)" }}>
            Cognitive Strategy Agent
          </span>
        </h6>

        <div className="row g-2 mb-3">
          <div className="col-6">
            <small className="text-muted d-block">Pipeline</small>
            <strong className="d-block" style={{ fontSize: "0.85rem" }}>
              {PIPELINE_LABELS[strategy.pipeline]}
            </strong>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Logic Stick</small>
            <strong className="d-block" style={{ fontSize: "0.85rem" }}>
              {STICK_LABELS[strategy.logicStick]}
            </strong>
          </div>
        </div>

        <div className="mb-3">
          <small className="text-muted d-block mb-1">Curiosity Techniques</small>
          {strategy.curiosityTechniques.map((t) => (
            <span
              key={t}
              className="badge rounded-pill me-1"
              style={{
                background: "rgba(255, 179, 0, 0.15)",
                color: "#e6a200",
                fontSize: "0.75rem",
              }}
            >
              {CURIOSITY_LABELS[t]}
            </span>
          ))}
        </div>

        {strategy.memorizationTechnique && (
          <div className="mb-3">
            <small className="text-muted d-block mb-1">
              Memorization Technique
            </small>
            <span
              className="badge rounded-pill"
              style={{
                background: "rgba(0, 191, 165, 0.12)",
                color: "var(--pw-success)",
                fontSize: "0.75rem",
              }}
            >
              {strategy.memorizationTechnique}
            </span>
          </div>
        )}

        <div className="mb-3">
          <small className="text-muted d-block mb-1">Emotional Arc</small>
          <p style={{ fontSize: "0.85rem", marginBottom: 0 }}>
            {strategy.emotionalArc}
          </p>
        </div>

        <div className="mb-3">
          <small className="text-muted d-block mb-1">Style Direction</small>
          <div className="d-flex flex-wrap gap-1">
            <span className="style-badge style-badge-genre">
              {strategy.styleRecommendation.genre}
            </span>
            <span className="style-badge style-badge-mood">
              {strategy.styleRecommendation.mood}
            </span>
            <span className="style-badge style-badge-tempo">
              {strategy.styleRecommendation.tempoRange}
            </span>
            <span className="style-badge style-badge-vocal">
              {strategy.styleRecommendation.vocalSuggestion}
            </span>
          </div>
        </div>

        <details>
          <summary
            className="text-muted"
            style={{ fontSize: "0.8rem", cursor: "pointer" }}
          >
            CSA Reasoning
          </summary>
          <p
            className="mt-2 text-muted"
            style={{ fontSize: "0.8rem", lineHeight: 1.5 }}
          >
            {strategy.reasoning}
          </p>
        </details>
      </div>
    </div>
  );
}
