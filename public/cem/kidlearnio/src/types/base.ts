/**
 * Base Types — Shared schemas used across the type system
 *
 * This file exists to avoid circular imports between index.ts and strategy.ts
 */

import { z } from 'zod';

// ============================================================================
// LANGUAGE SCHEMAS
// ============================================================================

export const SupportedLanguageSchema = z.enum(['en', 'tr', 'zh']);
export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>;

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const AgeRangeSchema = z.tuple([
  z.number().min(5).max(18),
  z.number().min(5).max(18),
]).refine(([min, max]) => min <= max, {
  message: 'Minimum age must be less than or equal to maximum age',
});

export type AgeRange = z.infer<typeof AgeRangeSchema>;

export const TechniqueSchema = z.enum(['memorization', 'connection']);
export type Technique = z.infer<typeof TechniqueSchema>;
