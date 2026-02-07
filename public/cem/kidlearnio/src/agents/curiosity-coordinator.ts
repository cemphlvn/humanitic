/**
 * Curiosity Coordinator
 *
 * Multi-orchestrator architecture: Each domain has its own coordinator.
 * Curiosity Coordinator manages wonder-sparking across the pipeline.
 *
 * Coordinates:
 * - curiosity_spark stick (wonder patterns)
 * - Hook generation
 * - Question placement
 * - Sustainer callbacks
 */

import type { AgeRange, SupportedLanguage } from '@/types';

// Import will work once curiosity_spark is registered
// import { curiositySpark } from '@humanitic/logic-sticks';

export interface CuriosityCoordinatorInput {
  topic: string;
  ageRange: AgeRange;
  language: SupportedLanguage;
  coreConcepts: string[];
  keyFacts: string[];
}

export interface CuriosityCoordinatorOutput {
  // Primary hook for song opening
  primaryHook: {
    type: 'mystery_box' | 'surprise_reveal' | 'personal_connection' | 'contradiction_hook' | 'scale_shock';
    text: string;
  };

  // Curiosity triggers distributed across song
  triggers: CuriosityTrigger[];

  // Callback points (where to reference earlier mysteries)
  callbacks: CallbackPoint[];

  // Final reveal structure
  finalReveal: string;

  // Guidance for lyrics agent
  coordinatorGuidance: string;
}

export interface CuriosityTrigger {
  section: 'hook' | 'verse1' | 'chorus' | 'verse2' | 'bridge';
  type: string;
  suggestion: string;
}

export interface CallbackPoint {
  section: string;
  reference: string;
}

/**
 * Curiosity Coordinator
 *
 * Orchestrates curiosity-related decisions across the pipeline.
 * Works with curiosity_spark stick but adds coordination logic.
 */
export class CuriosityCoordinator {
  private ageRange: AgeRange;
  // language reserved for future language-specific curiosity patterns

  constructor(ageRange: AgeRange, _language: SupportedLanguage) {
    this.ageRange = ageRange;
  }

  /**
   * Coordinate curiosity patterns for a topic
   */
  coordinate(input: CuriosityCoordinatorInput): CuriosityCoordinatorOutput {
    const [minAge] = this.ageRange;

    // Determine best hook type for age
    const hookType = this.selectHookType(minAge);

    // Generate primary hook
    const primaryHook = this.generatePrimaryHook(hookType, input.topic, input.keyFacts);

    // Distribute triggers across song sections
    const triggers = this.distributeTriggers(input.coreConcepts, minAge);

    // Plan callback points
    const callbacks = this.planCallbacks(primaryHook);

    // Design final reveal
    const finalReveal = this.designFinalReveal(input.topic);

    // Build coordinator guidance for downstream agents
    const coordinatorGuidance = this.buildGuidance(primaryHook, triggers, callbacks, finalReveal);

    return {
      primaryHook,
      triggers,
      callbacks,
      finalReveal,
      coordinatorGuidance,
    };
  }

  private selectHookType(minAge: number): CuriosityCoordinatorOutput['primaryHook']['type'] {
    if (minAge <= 7) {
      return 'mystery_box'; // Concrete puzzles work best
    }
    if (minAge <= 10) {
      return 'surprise_reveal'; // They love "did you know"
    }
    return 'contradiction_hook'; // Can handle paradoxes
  }

  private generatePrimaryHook(
    type: CuriosityCoordinatorOutput['primaryHook']['type'],
    topic: string,
    _keyFacts: string[] // reserved for fact-specific hooks
  ): CuriosityCoordinatorOutput['primaryHook'] {
    // Generate hook template based on type
    const templates: Record<typeof type, string> = {
      mystery_box: `Here's a puzzle about ${topic} — can you figure it out?`,
      surprise_reveal: `Did you know? ${topic} has a secret...`,
      personal_connection: `Right now, ${topic} is happening to YOU!`,
      contradiction_hook: `This seems impossible, but ${topic}...`,
      scale_shock: `${topic} is bigger/smaller/faster than you think!`,
    };

    return {
      type,
      text: templates[type],
    };
  }

  private distributeTriggers(_concepts: string[], minAge: number): CuriosityTrigger[] {
    const triggers: CuriosityTrigger[] = [];

    // Hook: Primary curiosity trigger
    triggers.push({
      section: 'hook',
      type: 'opening_mystery',
      suggestion: 'Open with question or surprise, never a statement',
    });

    // Verse 1: Build toward the mystery
    triggers.push({
      section: 'verse1',
      type: 'breadcrumb',
      suggestion: 'Give partial clues that build anticipation',
    });

    // Verse 2: Deepen with new angle
    triggers.push({
      section: 'verse2',
      type: minAge <= 10 ? 'personal_connection' : 'contradiction',
      suggestion: minAge <= 10
        ? 'Connect to child\'s direct experience'
        : 'Present a paradox or surprising twist',
    });

    // Bridge: The "aha" setup
    triggers.push({
      section: 'bridge',
      type: 'revelation_setup',
      suggestion: 'Set up the final understanding with a cliffhanger',
    });

    return triggers;
  }

  private planCallbacks(_primaryHook: CuriosityCoordinatorOutput['primaryHook']): CallbackPoint[] {
    return [
      {
        section: 'verse2',
        reference: `Reference the opening mystery: "Remember when we asked...?"`,
      },
      {
        section: 'bridge',
        reference: `Connect back to hook before final reveal`,
      },
      {
        section: 'final_chorus',
        reference: `"Now you know!" — ownership of the answer`,
      },
    ];
  }

  private designFinalReveal(topic: string): string {
    return `End with ownership: "Now YOU know the secret of ${topic}!" + celebratory movement [clap clap clap]`;
  }

  private buildGuidance(
    hook: CuriosityCoordinatorOutput['primaryHook'],
    triggers: CuriosityTrigger[],
    callbacks: CallbackPoint[],
    finalReveal: string
  ): string {
    const triggerList = triggers.map(t => `- ${t.section}: ${t.suggestion}`).join('\n');
    const callbackList = callbacks.map(c => `- ${c.section}: ${c.reference}`).join('\n');

    return `
══════════════════════════════════════════════════════════════════════════
CURIOSITY COORDINATOR GUIDANCE
══════════════════════════════════════════════════════════════════════════

PRIMARY HOOK (${hook.type}):
${hook.text}

TRIGGER DISTRIBUTION:
${triggerList}

CALLBACK POINTS (reference earlier mysteries):
${callbackList}

FINAL REVEAL:
${finalReveal}

CRITICAL RULES:
1. NEVER open with "Today we'll learn about..." or similar
2. EVERY section should have a question or moment of wonder
3. The chorus should feel like discovering a secret
4. End with OWNERSHIP — "Now YOU know!"

══════════════════════════════════════════════════════════════════════════
`.trim();
  }
}

/**
 * Factory function for creating coordinator
 */
export function createCuriosityCoordinator(
  ageRange: AgeRange,
  language: SupportedLanguage
): CuriosityCoordinator {
  return new CuriosityCoordinator(ageRange, language);
}
