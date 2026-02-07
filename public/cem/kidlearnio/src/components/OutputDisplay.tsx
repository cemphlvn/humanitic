'use client';

import { useState, useCallback } from 'react';
import type { GenerationMetadata } from '@/types';
import { LANGUAGE_NAMES } from '@/types';

interface OutputDisplayProps {
  lyrics?: string;
  style?: string;
  metadata: GenerationMetadata;
}

export function OutputDisplay({ lyrics, style, metadata }: OutputDisplayProps) {
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [copiedStyle, setCopiedStyle] = useState(false);

  const copyToClipboard = useCallback(
    async (text: string, type: 'lyrics' | 'style') => {
      try {
        await navigator.clipboard.writeText(text);
        if (type === 'lyrics') {
          setCopiedLyrics(true);
          setTimeout(() => setCopiedLyrics(false), 2000);
        } else {
          setCopiedStyle(true);
          setTimeout(() => setCopiedStyle(false), 2000);
        }
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    },
    []
  );

  return (
    <div>
      {/* Metadata bar */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <span className="badge bg-primary">
          <i className="fas fa-book-open me-1" />
          {metadata.topic}
        </span>
        <span className="badge" style={{ background: 'var(--wonder-accent)', color: 'white' }}>
          <i className="fas fa-globe me-1" />
          {LANGUAGE_NAMES[metadata.language]}
        </span>
        <span className="badge bg-secondary">
          <i className="fas fa-child me-1" />
          Ages {metadata.ageRange[0]}-{metadata.ageRange[1]}
        </span>
        <span className="badge bg-info text-dark">
          <i className="fas fa-brain me-1" />
          {metadata.technique === 'memorization' ? 'Memorization' : 'Connection'}
        </span>
        <span className="badge bg-light text-dark">
          <i className="fas fa-clock me-1" />
          {(metadata.durationMs / 1000).toFixed(1)}s
        </span>
      </div>

      {/* Lyrics Output */}
      {lyrics && (
        <div className="output-card">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h3>
              <i className="fas fa-music" />
              Lyrics
            </h3>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(lyrics, 'lyrics')}
            >
              <i className={`fas ${copiedLyrics ? 'fa-check' : 'fa-copy'}`} />
              {copiedLyrics ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="lyrics-display">{lyrics}</div>
        </div>
      )}

      {/* Style Output */}
      {style && (
        <div className="output-card">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h3>
              <i className="fas fa-palette" />
              Suno Style Prompt
            </h3>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(style, 'style')}
            >
              <i className={`fas ${copiedStyle ? 'fa-check' : 'fa-copy'}`} />
              {copiedStyle ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="style-display">{style}</div>
          <p className="text-muted mt-3 mb-0 small">
            <i className="fas fa-info-circle me-1" />
            Paste this into Suno's "Style of Music" field along with the lyrics
          </p>
        </div>
      )}

      {/* Next Steps */}
      <div className="output-card" style={{ background: 'var(--knowledge-surface)' }}>
        <h4 className="mb-3">
          <i className="fas fa-arrow-right me-2" style={{ color: 'var(--growth-secondary)' }} />
          Next Steps
        </h4>
        <ol className="mb-0">
          <li className="mb-2">
            Copy the <strong>lyrics</strong> and paste into Suno's lyrics field
          </li>
          <li className="mb-2">
            Copy the <strong>style prompt</strong> and paste into the "Style of
            Music" field
          </li>
          <li className="mb-2">
            Click "Create" in Suno and wait for your educational song!
          </li>
          <li>
            Share the song with your students and watch them learn through music
          </li>
        </ol>
      </div>
    </div>
  );
}
