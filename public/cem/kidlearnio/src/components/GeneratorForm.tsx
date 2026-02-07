'use client';

import { useState, useCallback } from 'react';
import { MDBInput, MDBRange } from 'mdb-react-ui-kit';
import type { Technique } from '@/types';

interface GeneratorFormProps {
  onGenerate: (data: {
    topic: string;
    ageRange: [number, number];
    technique: Technique;
  }) => void;
  isLoading: boolean;
}

export function GeneratorForm({ onGenerate, isLoading }: GeneratorFormProps) {
  const [topic, setTopic] = useState('');
  const [ageMin, setAgeMin] = useState(8);
  const [ageMax, setAgeMax] = useState(10);
  const [technique, setTechnique] = useState<Technique>('connection');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!topic.trim()) return;

      onGenerate({
        topic: topic.trim(),
        ageRange: [ageMin, ageMax],
        technique,
      });
    },
    [topic, ageMin, ageMax, technique, onGenerate]
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* Topic Input */}
      <div className="mb-4">
        <label className="form-label fw-bold">
          <i className="fas fa-lightbulb me-2" style={{ color: 'var(--wonder-accent)' }} />
          What should kids learn about?
        </label>
        <MDBInput
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., How plants make food, The water cycle, Times tables..."
          className="topic-input"
          size="lg"
          disabled={isLoading}
        />
      </div>

      {/* Age Range */}
      <div className="age-slider-container mb-4">
        <label className="age-label">
          <i className="fas fa-child me-2" style={{ color: 'var(--growth-secondary)' }} />
          Age Range
        </label>
        <div className="d-flex align-items-center gap-3">
          <div className="flex-grow-1">
            <MDBRange
              min={5}
              max={18}
              value={ageMin}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setAgeMin(Math.min(val, ageMax));
              }}
              disabled={isLoading}
            />
          </div>
          <span className="age-display">{ageMin}</span>
          <span className="text-muted">to</span>
          <span className="age-display">{ageMax}</span>
          <div className="flex-grow-1">
            <MDBRange
              min={5}
              max={18}
              value={ageMax}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setAgeMax(Math.max(val, ageMin));
              }}
              disabled={isLoading}
            />
          </div>
        </div>
        <small className="text-muted d-block mt-1">
          {ageMin <= 7
            ? 'Young learners — simple, concrete, playful'
            : ageMin <= 10
              ? 'Growing minds — can handle some complexity'
              : 'Older kids — abstract thinking OK'}
        </small>
      </div>

      {/* Technique Selection */}
      <div className="mb-4">
        <label className="form-label fw-bold">
          <i className="fas fa-brain me-2" style={{ color: 'var(--spark-primary)' }} />
          Learning Approach
        </label>
        <div className="technique-buttons">
          <button
            type="button"
            className={`technique-btn ${technique === 'memorization' ? 'active' : ''}`}
            onClick={() => setTechnique('memorization')}
            disabled={isLoading}
          >
            <h4>
              <i className="fas fa-repeat me-2" />
              Memorization
            </h4>
            <p>
              For facts, sequences, formulas. Uses mnemonics, rhythm, and
              repetition.
            </p>
          </button>
          <button
            type="button"
            className={`technique-btn ${technique === 'connection' ? 'active' : ''}`}
            onClick={() => setTechnique('connection')}
            disabled={isLoading}
          >
            <h4>
              <i className="fas fa-link me-2" />
              Connection
            </h4>
            <p>
              For understanding processes and systems. Builds deep
              comprehension.
            </p>
          </button>
        </div>
      </div>

      {/* Generate Button */}
      <button
        type="submit"
        className="generate-btn"
        disabled={isLoading || !topic.trim()}
      >
        {isLoading ? (
          <>
            <div className="loading-notes">
              <div className="loading-note" />
              <div className="loading-note" />
              <div className="loading-note" />
            </div>
            <span className="ms-2">Creating magic...</span>
          </>
        ) : (
          <>
            <i className="fas fa-wand-magic-sparkles" />
            Generate Song
          </>
        )}
      </button>
    </form>
  );
}
