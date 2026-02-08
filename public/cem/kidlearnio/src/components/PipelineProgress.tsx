'use client';

import type { PipelineStage } from '@/types';

interface PipelineProgressProps {
  currentStage: PipelineStage;
}

const STAGES: {
  id: PipelineStage;
  label: string;
  icon: string;
}[] = [
  { id: 'GATHERING_CONTEXT', label: 'Context', icon: 'fa-search' },
  { id: 'APPLYING_TECHNIQUE', label: 'Technique', icon: 'fa-brain' },
  { id: 'GENERATING_FLOW_GUIDANCE', label: 'Flow', icon: 'fa-wave-square' },
  { id: 'GENERATING_LYRICS', label: 'Lyrics', icon: 'fa-music' },
  { id: 'GENERATING_STYLE', label: 'Style', icon: 'fa-palette' },
  { id: 'STORING_MEMORY', label: 'Memory', icon: 'fa-database' },
  { id: 'COMPLETE', label: 'Done!', icon: 'fa-check' },
];

export function PipelineProgress({ currentStage }: PipelineProgressProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="pipeline-progress">
      {STAGES.map((stage, index) => {
        const isActive = stage.id === currentStage;
        const isComplete = index < currentIndex;
        const isPending = index > currentIndex;

        return (
          <div
            key={stage.id}
            className={`pipeline-stage ${
              isActive ? 'active' : isComplete ? 'complete' : ''
            }`}
            style={{
              opacity: isPending ? 0.4 : 1,
            }}
          >
            <i className={`fas ${stage.icon}`} />
            <span className="d-none d-md-inline">{stage.label}</span>
          </div>
        );
      })}
    </div>
  );
}
