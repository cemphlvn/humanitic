/**
 * Logic Sticks — Exported Stick Definitions
 *
 * Each stick is an atomic reasoning pattern that can be composed
 * with others to form complex agent behaviors.
 */

export { ageAdapter, type AgeAdapterInput, type AgeAdapterOutput } from './age-adapter.js';
export { languageRouter, type LanguageRouterInput, type LanguageRouterOutput } from './language-router.js';
export { structureScaffold, type StructureScaffoldInput, type StructureScaffoldOutput } from './structure-scaffold.js';

// Stick registry for dynamic lookup
export { STICK_REGISTRY, getStick, getAllSticks } from './registry.js';
