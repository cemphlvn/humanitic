'use client';

import { useState, useCallback, useMemo } from 'react';
import { MDBContainer, MDBRow, MDBCol } from 'mdb-react-ui-kit';
import { GeneratorForm } from '@/components/GeneratorForm';
import { OutputDisplay } from '@/components/OutputDisplay';
import { AgentActivityPanel } from '@/components/AgentActivityPanel';
import type { GenerationOutput, Technique, SupportedLanguage } from '@/types';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<GenerationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestBody, setRequestBody] = useState<Record<string, unknown> | null>(null);

  // Handle generation start - triggers SSE stream
  const handleGenerate = useCallback(
    (formData: {
      topic: string;
      ageRange: [number, number];
      technique: Technique;
      language: SupportedLanguage;
    }) => {
      setIsLoading(true);
      setError(null);
      setOutput(null);

      // Set request body to trigger SSE connection
      setRequestBody({
        topic: formData.topic,
        ageRange: formData.ageRange,
        technique: formData.technique,
        language: formData.language,
        outputType: 'both',
      });
    },
    []
  );

  // Handle result from SSE stream
  const handleResult = useCallback((result: unknown) => {
    setOutput(result as GenerationOutput);
    setIsLoading(false);
  }, []);

  // Handle error from SSE stream
  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setIsLoading(false);
  }, []);

  // Memoize request body to prevent unnecessary re-renders
  const stableRequestBody = useMemo(() => requestBody, [requestBody]);

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

              {/* Real-time Agent Activity Panel */}
              <AgentActivityPanel
                isActive={isLoading}
                requestBody={stableRequestBody ?? undefined}
                onResult={handleResult}
                onError={handleError}
              />

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
