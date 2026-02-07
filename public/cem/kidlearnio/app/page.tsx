'use client';

import { useState, useCallback } from 'react';
import { MDBContainer, MDBRow, MDBCol } from 'mdb-react-ui-kit';
import { GeneratorForm } from '@/components/GeneratorForm';
import { OutputDisplay } from '@/components/OutputDisplay';
import { PipelineProgress } from '@/components/PipelineProgress';
import type { GenerationOutput, PipelineStage, Technique } from '@/types';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<PipelineStage>('IDLE');
  const [output, setOutput] = useState<GenerationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(
    async (formData: {
      topic: string;
      ageRange: [number, number];
      technique: Technique;
    }) => {
      setIsLoading(true);
      setError(null);
      setOutput(null);
      setCurrentStage('GATHERING_CONTEXT');

      try {
        // Simulate stage progression for UX
        const stages: PipelineStage[] = [
          'GATHERING_CONTEXT',
          'APPLYING_TECHNIQUE',
          'GENERATING_LYRICS',
          'GENERATING_STYLE',
          'STORING_MEMORY',
        ];

        let stageIndex = 0;
        const stageInterval = setInterval(() => {
          if (stageIndex < stages.length) {
            setCurrentStage(stages[stageIndex] as PipelineStage);
            stageIndex++;
          }
        }, 2000);

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: formData.topic,
            ageRange: formData.ageRange,
            technique: formData.technique,
            outputType: 'both',
          }),
        });

        clearInterval(stageInterval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error ?? 'Generation failed');
        }

        const result: GenerationOutput = await response.json();
        setOutput(result);
        setCurrentStage('COMPLETE');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setCurrentStage('ERROR');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <MDBContainer>
          <h1 className="app-title">
            <i className="fas fa-music" />
            KidLearnio
          </h1>
        </MDBContainer>
      </header>

      <MDBContainer className="py-5">
        <MDBRow>
          <MDBCol lg="5" className="mb-4 mb-lg-0">
            <div className="generator-card">
              <h2 className="mb-4">Create Educational Song</h2>
              <GeneratorForm onGenerate={handleGenerate} isLoading={isLoading} />

              {isLoading && (
                <PipelineProgress currentStage={currentStage} />
              )}

              {error && (
                <div className="alert alert-danger mt-4" role="alert">
                  <i className="fas fa-exclamation-circle me-2" />
                  {error}
                </div>
              )}
            </div>
          </MDBCol>

          <MDBCol lg="7">
            {output && output.success ? (
              <OutputDisplay
                lyrics={output.lyrics}
                style={output.style}
                metadata={output.metadata}
              />
            ) : (
              <div className="generator-card text-center py-5">
                <i
                  className="fas fa-wand-magic-sparkles fa-3x mb-4"
                  style={{ color: 'var(--knowledge-light)' }}
                />
                <h3 style={{ color: 'var(--knowledge-medium)' }}>
                  Your song will appear here
                </h3>
                <p className="text-muted">
                  Enter a topic and click generate to create educational lyrics
                  and a Suno style prompt
                </p>
              </div>
            )}
          </MDBCol>
        </MDBRow>
      </MDBContainer>

      <footer className="text-center py-4 text-muted">
        <small>
          KidLearnio — A{' '}
          <a
            href="https://github.com/humanitic"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--spark-primary)' }}
          >
            Humanitic
          </a>{' '}
          Instance | Curiosity founders rewarded by contribution degree
        </small>
      </footer>
    </div>
  );
}
