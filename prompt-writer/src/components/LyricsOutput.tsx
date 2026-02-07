"use client";

import { useState } from "react";
import type { LyricsOutput as LyricsOutputType } from "@/types";

interface LyricsOutputProps {
  lyrics: LyricsOutputType;
}

function highlightSunoTags(text: string): React.ReactNode[] {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      return (
        <span key={i} className="suno-tag">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function LyricsOutputDisplay({ lyrics }: LyricsOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(lyrics.lyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const charClass =
    lyrics.characterCount <= 3000
      ? "ok"
      : lyrics.characterCount <= 4500
        ? "warn"
        : "over";

  return (
    <div className="card card-lyrics shadow-2 mb-4 fade-in-up position-relative">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="card-title mb-0">
            <i
              className="fas fa-music me-2"
              style={{ color: "var(--pw-lyrics)" }}
            />
            Lyrics Output
          </h6>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={handleCopy}
            title="Copy lyrics"
          >
            <i className={`fas ${copied ? "fa-check" : "fa-copy"}`} />
            <span className="ms-1">{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>

        <div className="lyrics-output mb-3">
          {highlightSunoTags(lyrics.lyrics)}
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <div>
            <small className="text-muted">
              <i className="fas fa-lightbulb me-1" style={{ color: "var(--pw-secondary)" }} />
              Curiosity Hook: <em>{lyrics.curiosityHook}</em>
            </small>
          </div>
          <span className={`char-count ${charClass}`}>
            {lyrics.characterCount} / 5000 chars
          </span>
        </div>
      </div>
    </div>
  );
}
