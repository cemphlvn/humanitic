"use client";

import { useState } from "react";
import type { StyleOutput as StyleOutputType } from "@/types";

interface StyleOutputProps {
  style: StyleOutputType;
}

export default function StyleOutputDisplay({ style }: StyleOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(style.styleString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const charClass =
    style.characterCount <= 200
      ? "ok"
      : style.characterCount <= 500
        ? "warn"
        : "over";

  const { components } = style;

  return (
    <div className="card card-style shadow-2 mb-4 fade-in-up position-relative">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="card-title mb-0">
            <i
              className="fas fa-palette me-2"
              style={{ color: "var(--pw-style)" }}
            />
            Style Output
          </h6>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={handleCopy}
            title="Copy style"
          >
            <i className={`fas ${copied ? "fa-check" : "fa-copy"}`} />
            <span className="ms-1">{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>

        {/* Style string preview */}
        <div className="style-preview mb-3">{style.styleString}</div>

        {/* Decomposed badges */}
        <div className="mb-3">
          <span className="style-badge style-badge-genre">
            {components.genre}
          </span>
          {components.subGenre && (
            <span className="style-badge style-badge-genre">
              {components.subGenre}
            </span>
          )}
          {components.moods.map((m) => (
            <span key={m} className="style-badge style-badge-mood">
              {m}
            </span>
          ))}
          <span className="style-badge style-badge-tempo">
            {components.tempo} BPM
          </span>
          <span className="style-badge style-badge-tempo">
            {components.key}
          </span>
          {components.instruments.map((inst) => (
            <span key={inst} className="style-badge style-badge-instrument">
              {inst}
            </span>
          ))}
          {components.vocalStyle && (
            <span className="style-badge style-badge-vocal">
              {components.vocalStyle}
            </span>
          )}
          {components.production.map((p) => (
            <span key={p} className="style-badge style-badge-production">
              {p}
            </span>
          ))}
        </div>

        <div className="text-end">
          <span className={`char-count ${charClass}`}>
            {style.characterCount} / 1000 chars
          </span>
        </div>
      </div>
    </div>
  );
}
