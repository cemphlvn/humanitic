/**
 * Composition Utilities
 *
 * Utilities for composing sticks into pipelines.
 * Enforces ordering rules and conflict resolution.
 */

import type {
  LogicStick,
  CompositionOrder,
  ConflictResolution,
  StickResult,
} from './types.js';
import { getStick, getStickNames } from './sticks/registry.js';

/**
 * Default composition order for lyrics generation
 */
export const LYRICS_COMPOSITION_ORDER: CompositionOrder = {
  sticks: [
    'language_router', // MUST BE FIRST
    'age_adapter',
    'curiosity_spark',
    'structure_scaffold',
    'connection_bridge',
    'memorability_booster',
    'vocabulary_gate',
    'rhyme_finder',
  ] as const,
  enforced: true,
  description: 'Standard ordering for lyrics generation pipeline',
};

/**
 * Default composition order for style generation
 */
export const STYLE_COMPOSITION_ORDER: CompositionOrder = {
  sticks: ['age_adapter', 'suno_style_composer'] as const,
  enforced: true,
  description: 'Standard ordering for style prompt generation',
};

/**
 * Conflict resolution rules
 */
export const CONFLICT_RESOLUTION: ConflictResolution = {
  priority: ['safety', 'accuracy', 'memorability', 'style'] as const,
  example: {
    situation: 'rhyme_finder suggests word outside vocabulary_gate',
    resolution: 'vocabulary_gate wins, find different rhyme',
  },
};

/**
 * Validate a composition order
 */
export function validateCompositionOrder(
  stickNames: readonly string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allSticks = getStickNames();

  // Check language_router is first if present
  const hasLanguageRouter = stickNames.includes('language_router');
  if (hasLanguageRouter && stickNames[0] !== 'language_router') {
    errors.push('language_router must be first in composition order');
  }

  // Check all sticks exist
  for (const name of stickNames) {
    if (!allSticks.includes(name)) {
      errors.push(`Unknown stick: ${name}`);
    }
  }

  // Check for duplicate sticks
  const seen = new Set<string>();
  for (const name of stickNames) {
    if (seen.has(name)) {
      errors.push(`Duplicate stick: ${name}`);
    }
    seen.add(name);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Compose sticks into a pipeline function
 */
export function composeSticks<TInput, TOutput>(
  stickNames: readonly string[]
): (input: TInput) => StickResult<TOutput>[] {
  // Validate order
  const validation = validateCompositionOrder(stickNames);
  if (!validation.valid) {
    throw new Error(`Invalid composition: ${validation.errors.join(', ')}`);
  }

  // Get sticks
  const sticks = stickNames.map((name) => {
    const stick = getStick(name);
    if (!stick) {
      throw new Error(`Stick not found: ${name}`);
    }
    return { name, stick };
  });

  // Return pipeline function
  return (input: TInput): StickResult<TOutput>[] => {
    const results: StickResult<TOutput>[] = [];
    let currentInput: unknown = input;

    for (const { name, stick } of sticks) {
      try {
        const output = stick.apply(currentInput);
        results.push({
          success: true,
          output: output as TOutput,
          stickName: name,
        });
        // Pass output as input to next stick
        currentInput = { ...currentInput as object, ...output as object };
      } catch (error) {
        results.push({
          success: false,
          output: undefined as TOutput,
          stickName: name,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
        break; // Stop pipeline on error
      }
    }

    return results;
  };
}

/**
 * Check if two sticks can be composed together
 */
export function canCompose(stickA: string, stickB: string): boolean {
  const a = getStick(stickA);
  const b = getStick(stickB);

  if (!a || !b) return false;

  // Check if A precedes B (meaning B cannot come before A)
  if (a.composition.precedes?.includes(stickB)) {
    return true; // A can precede B
  }

  // Check if B composes with A
  if (b.composition.composesWith?.includes(stickA)) {
    return true;
  }

  // Default: allow composition
  return true;
}
