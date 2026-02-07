/**
 * Stick Registry
 *
 * Central registry for all Logic Sticks.
 * Enables dynamic lookup and composition.
 */

import type { LogicStick } from '../types.js';
import { ageAdapter } from './age-adapter.js';
import { languageRouter } from './language-router.js';
import { structureScaffold } from './structure-scaffold.js';

/**
 * Registry of all available sticks
 */
export const STICK_REGISTRY: Record<string, LogicStick<unknown, unknown>> = {
  age_adapter: ageAdapter as LogicStick<unknown, unknown>,
  language_router: languageRouter as LogicStick<unknown, unknown>,
  structure_scaffold: structureScaffold as LogicStick<unknown, unknown>,
  // Future sticks will be added here:
  // curiosity_spark: curiositySpark,
  // memorability_booster: memorabilityBooster,
  // connection_bridge: connectionBridge,
  // vocabulary_gate: vocabularyGate,
  // rhyme_finder: rhymeFinder,
  // suno_style_composer: sunoStyleComposer,
};

/**
 * Get a stick by name
 */
export function getStick(name: string): LogicStick<unknown, unknown> | undefined {
  return STICK_REGISTRY[name];
}

/**
 * Get all registered sticks
 */
export function getAllSticks(): LogicStick<unknown, unknown>[] {
  return Object.values(STICK_REGISTRY);
}

/**
 * Get stick names
 */
export function getStickNames(): string[] {
  return Object.keys(STICK_REGISTRY);
}

/**
 * Check if a stick exists
 */
export function hasStick(name: string): boolean {
  return name in STICK_REGISTRY;
}
