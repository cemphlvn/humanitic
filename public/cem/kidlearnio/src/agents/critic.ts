/**
 * Critic Agent
 *
 * Reflection agent that validates lyrics against strategy.
 * Pattern: Reflection for risk reduction
 * Source: https://medium.com/@dewasheesh.rana/agentic-ai-design-patterns-2026-ed-e3a5125162c5
 *
 * "Reflection is not for intelligence—it is for risk reduction"
 */

import type {
  GenerationStrategy,
  StructuredLyrics,
  CriticVerdict,
  CriticIssue,
} from '@/types';
import { CriticVerdictSchema } from '@/types';
import { callValidatedAgent } from '@/lib/validated-agent';
import { MODELS } from '@/lib/anthropic';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface CriticInput {
  strategy: GenerationStrategy;
  lyrics: StructuredLyrics;
  attemptNumber: number;
}

// ============================================================================
// DETERMINISTIC CHECKS (run before LLM)
// ============================================================================

/**
 * Run deterministic validation checks.
 * These don't need LLM - they're schema/rule based.
 */
export function runDeterministicChecks(
  strategy: GenerationStrategy,
  lyrics: StructuredLyrics
): CriticIssue[] {
  const issues: CriticIssue[] = [];

  // Check 1: Hook phrase match
  if (lyrics.hookPhrase.toLowerCase() !== strategy.hookPhrase.toLowerCase()) {
    issues.push({
      severity: 'error',
      category: 'hook_placement',
      message: `Hook phrase mismatch: expected "${strategy.hookPhrase}", got "${lyrics.hookPhrase}"`,
      suggestion: `Use exactly "${strategy.hookPhrase}" as the hook phrase`,
    });
  }

  // Check 2: Hook in first section
  const firstSection = lyrics.sections[0];
  if (firstSection?.type !== 'hook') {
    issues.push({
      severity: 'error',
      category: 'hook_placement',
      message: 'First section must be a hook',
      suggestion: 'Start the song with a [Hook] section',
    });
  }

  // Check 3: Duration within limit
  if (lyrics.estimatedDurationSeconds > strategy.maxDurationSeconds) {
    issues.push({
      severity: 'error',
      category: 'duration_exceeded',
      message: `Duration ${lyrics.estimatedDurationSeconds}s exceeds max ${strategy.maxDurationSeconds}s`,
      suggestion: 'Remove a verse or shorten sections',
    });
  }

  // Check 4: Section count
  if (lyrics.sections.length > strategy.maxSections) {
    issues.push({
      severity: 'error',
      category: 'section_limit_exceeded',
      message: `${lyrics.sections.length} sections exceeds max ${strategy.maxSections}`,
      suggestion: 'Combine or remove sections',
    });
  }

  // Check 5: Vocabulary anchors used
  const usedVocab = new Set(lyrics.vocabularyUsed.map(v => v.toLowerCase()));
  const requiredVocab = strategy.vocabularyAnchors.map(v => v.toLowerCase());
  const missingVocab = requiredVocab.filter(v => !usedVocab.has(v));

  if (missingVocab.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'vocabulary_mismatch',
      message: `Missing vocabulary anchors: ${missingVocab.join(', ')}`,
      suggestion: `Include these terms in the lyrics: ${missingVocab.join(', ')}`,
    });
  }

  // Check 6: Learning objectives covered
  const coveredObjectives = new Set(lyrics.learningObjectivesCovered);
  const missingObjectives = strategy.learningObjectives.filter(o => !coveredObjectives.has(o));

  if (missingObjectives.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'learning_objective_missing',
      message: `Uncovered learning objectives: ${missingObjectives.length}`,
      suggestion: `Address these objectives: ${missingObjectives.join('; ')}`,
    });
  }

  // Check 7: Hook repetition count
  if (lyrics.hookRepetitionCount < strategy.targetHookRepetitions) {
    issues.push({
      severity: 'warning',
      category: 'hook_placement',
      message: `Hook appears ${lyrics.hookRepetitionCount}x, target is ${strategy.targetHookRepetitions}x`,
      suggestion: 'Add more repetitions of the hook phrase',
    });
  }

  return issues;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

function buildCriticPrompt(input: CriticInput): string {
  return `You are the CRITIC of KidLearnio.

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION: Validate lyrics against the generation strategy.
═══════════════════════════════════════════════════════════════════════════════

You are a REFLECTION agent. Your job is RISK REDUCTION:
- Convert hallucinations to self-correction
- Convert silent errors to explicit critique
- Ensure the song will actually teach what it's supposed to teach

═══════════════════════════════════════════════════════════════════════════════
THE STRATEGY (This is the CONTRACT)
═══════════════════════════════════════════════════════════════════════════════

Topic: ${input.strategy.topic}
Language: ${input.strategy.language}
Technique: ${input.strategy.technique}
Age Range: ${input.strategy.ageRange[0]}-${input.strategy.ageRange[1]}

HOOK PHRASE (MUST appear exactly): "${input.strategy.hookPhrase}"
VOCABULARY ANCHORS (ALL must be used): ${input.strategy.vocabularyAnchors.join(', ')}
LEARNING OBJECTIVES (ALL must be covered):
${input.strategy.learningObjectives.map((o, i) => `  ${i + 1}. ${o}`).join('\n')}

HARD CONSTRAINTS:
- Max duration: ${input.strategy.maxDurationSeconds} seconds
- Max sections: ${input.strategy.maxSections}
- Hook repetitions: ${input.strategy.targetHookRepetitions}x minimum

EMOTIONAL ARC: ${input.strategy.emotionalArc}

═══════════════════════════════════════════════════════════════════════════════
THE LYRICS TO VALIDATE
═══════════════════════════════════════════════════════════════════════════════

${input.lyrics.rawLyrics}

═══════════════════════════════════════════════════════════════════════════════
VALIDATION CRITERIA
═══════════════════════════════════════════════════════════════════════════════

CHECK THESE (in order of importance):

1. HOOK PLACEMENT: Does the hook appear in the first 15 seconds (first section)?
2. VOCABULARY: Are ALL vocabulary anchors actually used in the lyrics?
3. LEARNING OBJECTIVES: Can a child learn what the objectives specify?
4. DURATION: Is it within the time limit?
5. SINGABILITY: Can this actually be sung? Are lines too long?
6. AGE APPROPRIATENESS: Is language right for ${input.strategy.ageRange[0]}-${input.strategy.ageRange[1]}?

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return a JSON object with your verdict:
{
  "pass": true/false,
  "score": 0-100,
  "issues": [
    {
      "severity": "error" | "warning" | "suggestion",
      "category": "hook_placement" | "vocabulary_mismatch" | "learning_objective_missing" | "duration_exceeded" | "section_limit_exceeded" | "age_inappropriate" | "singability",
      "message": "What's wrong",
      "suggestion": "How to fix it"
    }
  ],
  "hookInFirst15Seconds": true/false,
  "allVocabularyAnchorsUsed": true/false,
  "allLearningObjectivesCovered": true/false,
  "durationWithinLimit": true/false,
  "feedbackForRetry": "If pass=false, specific feedback for the lyrics agent to fix",
  "strategyId": "${input.strategy.id}",
  "attemptNumber": ${input.attemptNumber}
}

PASS CRITERIA:
- No "error" severity issues
- Score >= 70
- hookInFirst15Seconds = true
- durationWithinLimit = true

Be STRICT. It's better to fail and retry than to pass a bad song.`;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Run the critic to validate lyrics against strategy.
 */
export async function critiqueLyrics(input: CriticInput): Promise<CriticVerdict> {
  // First run deterministic checks
  const deterministicIssues = runDeterministicChecks(input.strategy, input.lyrics);

  // Check if deterministic issues already fail
  const hasErrors = deterministicIssues.some(i => i.severity === 'error');

  if (hasErrors) {
    // Fast fail - no need for LLM
    return {
      pass: false,
      score: 30,
      issues: deterministicIssues,
      hookInFirst15Seconds: !deterministicIssues.some(i => i.category === 'hook_placement'),
      allVocabularyAnchorsUsed: !deterministicIssues.some(i => i.category === 'vocabulary_mismatch'),
      allLearningObjectivesCovered: !deterministicIssues.some(i => i.category === 'learning_objective_missing'),
      durationWithinLimit: !deterministicIssues.some(i => i.category === 'duration_exceeded'),
      feedbackForRetry: buildFeedbackFromIssues(deterministicIssues),
      strategyId: input.strategy.id,
      attemptNumber: input.attemptNumber,
    };
  }

  // Run LLM critic for semantic validation
  const result = await callValidatedAgent(
    {
      name: 'Critic',
      schema: CriticVerdictSchema,
      systemPrompt: buildCriticPrompt(input),
      model: MODELS.CONTEXT_GATHERER, // Use cheaper model for validation
      maxTokens: 1024,
      temperature: 0.2, // Low for consistent validation
      maxRetries: 1, // Critic itself shouldn't need many retries
    },
    `Validate these lyrics against the strategy.

LYRICS METADATA:
- Sections: ${input.lyrics.sections.length}
- Estimated duration: ${input.lyrics.estimatedDurationSeconds}s
- Hook repetitions: ${input.lyrics.hookRepetitionCount}
- Vocabulary used: ${input.lyrics.vocabularyUsed.join(', ')}
- Objectives covered: ${input.lyrics.learningObjectivesCovered.join(', ')}

Provide your detailed verdict.`
  );

  // FAIL-SAFE: If Critic can't parse, return optimistic verdict with deterministic issues only
  // Rationale: Critic is enhancement layer, not gate. Partial success > total failure.
  if (!result.success || !result.data) {
    console.warn(`[Critic] LLM validation failed: ${result.error}. Using deterministic-only verdict.`);
    return {
      pass: deterministicIssues.filter(i => i.severity === 'error').length === 0,
      score: deterministicIssues.length === 0 ? 80 : 60,
      issues: deterministicIssues,
      hookInFirst15Seconds: !deterministicIssues.some(i => i.category === 'hook_placement'),
      allVocabularyAnchorsUsed: !deterministicIssues.some(i => i.category === 'vocabulary_mismatch'),
      allLearningObjectivesCovered: !deterministicIssues.some(i => i.category === 'learning_objective_missing'),
      durationWithinLimit: !deterministicIssues.some(i => i.category === 'duration_exceeded'),
      feedbackForRetry: deterministicIssues.length > 0 ? buildFeedbackFromIssues(deterministicIssues) : undefined,
      strategyId: input.strategy.id,
      attemptNumber: input.attemptNumber,
    };
  }

  const verdict = result.data;

  // Merge deterministic issues with LLM issues
  return {
    ...verdict,
    issues: [...deterministicIssues, ...verdict.issues],
    strategyId: input.strategy.id,
    attemptNumber: input.attemptNumber,
  };
}

/**
 * Build retry feedback from issues.
 */
function buildFeedbackFromIssues(issues: CriticIssue[]): string {
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  let feedback = 'FIX THESE ISSUES:\n\n';

  if (errors.length > 0) {
    feedback += 'ERRORS (must fix):\n';
    errors.forEach((e, i) => {
      feedback += `${i + 1}. ${e.message}\n   → ${e.suggestion}\n`;
    });
  }

  if (warnings.length > 0) {
    feedback += '\nWARNINGS (should fix):\n';
    warnings.forEach((w, i) => {
      feedback += `${i + 1}. ${w.message}\n   → ${w.suggestion}\n`;
    });
  }

  return feedback;
}

/**
 * Check if we should retry based on verdict.
 */
export function shouldRetry(verdict: CriticVerdict, maxAttempts: number = 3): boolean {
  return !verdict.pass && verdict.attemptNumber < maxAttempts;
}

/**
 * Get a summary of the verdict for observability.
 */
export function getVerdictSummary(verdict: CriticVerdict): string {
  const status = verdict.pass ? '✓ PASS' : '✗ FAIL';
  const errorCount = verdict.issues.filter(i => i.severity === 'error').length;
  const warningCount = verdict.issues.filter(i => i.severity === 'warning').length;

  return `${status} (Score: ${verdict.score}/100, Errors: ${errorCount}, Warnings: ${warningCount})`;
}
