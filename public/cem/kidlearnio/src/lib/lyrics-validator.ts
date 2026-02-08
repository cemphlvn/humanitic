/**
 * Lyrics Validator — Deterministic validation with bounded async fixes
 *
 * 2026 Agentic Principles:
 * 1. BOUNDED EXECUTION: Max retries, circuit breaker
 * 2. DETERMINISTIC FIRST: Prefer scriptic over agentic
 * 3. GRACEFUL DEGRADATION: Keep original if fix fails
 * 4. COST AWARENESS: Max parallel calls, abort if too expensive
 * 5. OBSERVABILITY: Log decisions, not just outcomes
 */

import { analyzeLyricsSyllables, formatSyllableFeedback, type SyllableAnalysis } from './turkish-syllable';
import { createMessage, MODELS } from './anthropic';

// CIRCUIT BREAKER CONFIG
const MAX_FIX_ATTEMPTS = 3; // Max lines to fix per invocation
const CIRCUIT_BREAKER_THRESHOLD = 2; // Failures before circuit opens

export interface ValidationResult {
  isValid: boolean;
  syllableAnalysis?: SyllableAnalysis;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  type: 'syllable_mismatch' | 'missing_teshis' | 'missing_tesbih';
  lineIndex: number;
  line: string;
  expected: string;
  severity: 'error' | 'warning';
}

export interface LineFixResult {
  originalLine: string;
  fixedLine: string;
  success: boolean;
}

/**
 * Validate Turkish lyrics deterministically
 */
export function validateTurkishLyrics(lyrics: string): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Syllable consistency check
  const syllableAnalysis = analyzeLyricsSyllables(lyrics);

  if (syllableAnalysis.consistencyScore < 0.8) {
    for (const lineInfo of syllableAnalysis.lines) {
      if (!lineInfo.isConsistent && lineInfo.syllables > 0) {
        issues.push({
          type: 'syllable_mismatch',
          lineIndex: syllableAnalysis.lines.indexOf(lineInfo),
          line: lineInfo.text,
          expected: `${syllableAnalysis.dominantCount} hece`,
          severity: 'error',
        });
      }
    }
  }

  return {
    isValid: issues.filter(i => i.severity === 'error').length === 0,
    syllableAnalysis,
    issues,
  };
}

/**
 * Fix a single line to match target syllable count
 * Async — calls Claude only for the specific line
 */
export async function fixSingleLine(
  line: string,
  targetSyllables: number,
  _context: { topic: string; language: string }
): Promise<LineFixResult> {
  try {
    const prompt = `Aşağıdaki satırı TAM OLARAK ${targetSyllables} heceli yap.
Anlamı koru. Sadece heceyi düzelt.

Orijinal: "${line}"
Hedef: ${targetSyllables} hece

Sadece düzeltilmiş satırı yaz, başka bir şey yazma.`;

    const fixed = await createMessage(
      'Sen Türkçe şiir düzeltme uzmanısın. Hece ölçüsünü koruyarak satır düzelt.',
      prompt,
      { model: MODELS.MICRO_FIXER, maxTokens: 100, agentName: 'micro-fixer' }
    );

    return {
      originalLine: line,
      fixedLine: fixed.trim(),
      success: true,
    };
  } catch {
    return {
      originalLine: line,
      fixedLine: line, // Keep original if fix fails
      success: false,
    };
  }
}

/**
 * Fix only the problematic lines with bounded execution
 *
 * SAFETY FEATURES:
 * - Circuit breaker: Opens after CIRCUIT_BREAKER_THRESHOLD consecutive failures
 * - Max attempts: Only fixes MAX_FIX_ATTEMPTS lines
 * - Sequential execution: No parallel calls (easier to circuit break)
 * - Early exit: Stops on circuit open
 */
export async function fixProblematicLines(
  lyrics: string,
  validation: ValidationResult,
  context: { topic: string; language: string }
): Promise<{ lyrics: string; fixedCount: number; failedCount: number; circuitOpen: boolean }> {
  if (validation.isValid || !validation.syllableAnalysis) {
    return { lyrics, fixedCount: 0, failedCount: 0, circuitOpen: false };
  }

  const targetSyllables = validation.syllableAnalysis.dominantCount;
  const lines = lyrics.split('\n');

  // BOUNDED: Only fix MAX_FIX_ATTEMPTS lines
  const linesToFix = validation.issues
    .filter(i => i.type === 'syllable_mismatch')
    .slice(0, MAX_FIX_ATTEMPTS);

  if (linesToFix.length === 0) {
    return { lyrics, fixedCount: 0, failedCount: 0, circuitOpen: false };
  }

  let fixedCount = 0;
  let failedCount = 0;
  let consecutiveFailures = 0;

  // SEQUENTIAL (not parallel) — enables circuit breaker
  for (const issue of linesToFix) {
    // CIRCUIT BREAKER: Stop if too many consecutive failures
    if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      console.log('[Validator] Circuit breaker OPEN — stopping fixes');
      return { lyrics: lines.join('\n'), fixedCount, failedCount, circuitOpen: true };
    }

    const result = await fixSingleLine(issue.line, targetSyllables, context);

    if (result.success && result.fixedLine !== result.originalLine) {
      const lineIdx = lines.indexOf(issue.line);
      if (lineIdx !== -1) {
        lines[lineIdx] = result.fixedLine;
        fixedCount++;
        consecutiveFailures = 0; // Reset on success
        console.log(`[Validator] Fixed line: "${issue.line}" → "${result.fixedLine}"`);
      }
    } else {
      failedCount++;
      consecutiveFailures++;
    }
  }

  return {
    lyrics: lines.join('\n'),
    fixedCount,
    failedCount,
    circuitOpen: false,
  };
}

/**
 * Validate and optionally fix lyrics with bounded execution
 *
 * Returns validation result + optionally fixed lyrics
 * SAFETY: Graceful degradation — returns original if all fixes fail
 */
export async function validateAndFix(
  lyrics: string,
  language: string,
  topic: string,
  autoFix: boolean = false
): Promise<{
  validation: ValidationResult;
  lyrics: string;
  wasFixed: boolean;
  circuitOpen?: boolean;
}> {
  // DETERMINISTIC FIRST: Only Turkish has validation (no LLM needed)
  if (language !== 'tr') {
    return {
      validation: { isValid: true, issues: [] },
      lyrics,
      wasFixed: false,
    };
  }

  const validation = validateTurkishLyrics(lyrics);

  // OBSERVABILITY: Log validation result
  if (validation.syllableAnalysis) {
    console.log('[Validator]', formatSyllableFeedback(validation.syllableAnalysis));
  }

  // GRACEFUL DEGRADATION: Skip fixes if already valid or autoFix disabled
  if (!autoFix || validation.isValid) {
    return { validation, lyrics, wasFixed: false };
  }

  // BOUNDED AGENTIC: Fix with circuit breaker
  const fixResult = await fixProblematicLines(lyrics, validation, { topic, language });

  console.log(`[Validator] Fixed ${fixResult.fixedCount}/${MAX_FIX_ATTEMPTS}, ` +
    `failed ${fixResult.failedCount}, circuit ${fixResult.circuitOpen ? 'OPEN' : 'closed'}`);

  return {
    validation,
    lyrics: fixResult.lyrics,
    wasFixed: fixResult.fixedCount > 0,
    circuitOpen: fixResult.circuitOpen,
  };
}
