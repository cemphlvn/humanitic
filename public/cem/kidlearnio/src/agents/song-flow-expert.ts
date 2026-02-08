import { readFile } from 'fs/promises';
import { join } from 'path';
import type {
  AgeRange,
  Technique,
  GatheredContext,
  SupportedLanguage,
} from '@/types';
import { createMessage, MODELS } from '@/lib/anthropic';

/**
 * Song Flow Mastery Expert — HYBRID Architecture
 *
 * SCRIPTIC: Loads constraints from SONG_FLOW_MASTERY_BRAIN.md (no API call)
 * AGENTIC: Claude generates tailored suggestions for lyrics agent
 *
 * Purpose: Create shorter, more vivid, mentally-engaging songs
 */

// ============================================================================
// TYPES
// ============================================================================

export interface FlowConstraints {
  duration: {
    targetSeconds: number;
    maxSeconds: number;
  };
  structure: {
    maxSections: number;
    hookFrequency: number; // bars
    verseMaxLines: number;
  };
  imagery: {
    maxPerVerse: number;
    concreteness: 'high' | 'medium' | 'low';
  };
  repetition: {
    hookRepeats: number;
    keyConceptEverySection: boolean;
  };
}

export interface FlowSuggestions {
  hookPhraseCandidates: string[];
  imageryRecommendations: string[];
  compressionTips: string[];
  structureAdvice: string;
  languageFlowNotes: string;
}

export interface FlowGuidance {
  constraints: FlowConstraints;
  suggestions: FlowSuggestions;
  coordinatorGuidance: string; // For lyrics-agent prompt injection
}

// ============================================================================
// SCRIPTIC: Load Flow Constraints (No API Call)
// ============================================================================

// Cache for Mastery Brain document
let masteryBrainCache: { content: string; timestamp: number } | null = null;
const CACHE_TTL_MS = 60000; // 1 minute

/**
 * Load the Song Flow Mastery Brain document.
 */
async function loadMasteryBrain(): Promise<string> {
  const now = Date.now();

  if (masteryBrainCache && now - masteryBrainCache.timestamp < CACHE_TTL_MS) {
    return masteryBrainCache.content;
  }

  const brainPath = join(process.cwd(), 'docs', 'SONG_FLOW_MASTERY_BRAIN.md');

  try {
    const content = await readFile(brainPath, 'utf-8');
    masteryBrainCache = { content, timestamp: now };
    return content;
  } catch (error) {
    console.error('Failed to load Song Flow Mastery Brain:', error);
    throw new Error('Song Flow Mastery Brain not found');
  }
}

/**
 * Extract flow constraints from Mastery Brain (scriptic, deterministic).
 * These are HARD LIMITS that the lyrics agent must respect.
 */
export function loadFlowConstraints(): FlowConstraints {
  // Hard-coded from SONG_FLOW_MASTERY_BRAIN.md constraints section
  // This is scriptic: deterministic, no API call needed
  return {
    duration: {
      targetSeconds: 75, // 60-90s target, midpoint
      maxSeconds: 90,
    },
    structure: {
      maxSections: 5, // Hook + Verse + Chorus + Verse + Bridge
      hookFrequency: 8, // Every 8 bars minimum
      verseMaxLines: 4,
    },
    imagery: {
      maxPerVerse: 1,
      concreteness: 'high',
    },
    repetition: {
      hookRepeats: 4, // 3-5 times, use 4
      keyConceptEverySection: true,
    },
  };
}

/**
 * Extract technique library excerpt for prompt injection.
 */
async function getTechniqueLibraryExcerpt(): Promise<string> {
  const brain = await loadMasteryBrain();

  // Extract the Technique Library section
  const libraryStart = brain.indexOf('## Technique Library');
  const libraryEnd = brain.indexOf('## Constraints', libraryStart);

  if (libraryStart === -1) {
    return '';
  }

  const section = brain.slice(libraryStart, libraryEnd !== -1 ? libraryEnd : undefined);

  // Truncate if too long
  if (section.length > 2000) {
    return section.slice(0, 2000) + '\n[... truncated ...]';
  }

  return section;
}

// ============================================================================
// AGENTIC: Generate Flow Suggestions (Claude Call)
// ============================================================================

/**
 * Build system prompt for flow suggestion generation.
 */
function buildFlowExpertPrompt(techniqueLibrary: string): string {
  return `You are the SONG FLOW MASTERY EXPERT of KidLearnio.

YOUR CURIOSITY:
You are deeply curious about what makes educational songs memorable and vivid.
You study how 60-second songs can be as impactful as 3-minute ones.
You obsess over mental imagery that sticks in young minds.

YOUR DOMAIN KNOWLEDGE:
${techniqueLibrary}

YOUR ROLE:
Provide SPECIFIC, ACTIONABLE suggestions for the lyrics agent.
Your suggestions should be tailored to the TOPIC, AGE, TECHNIQUE, and LANGUAGE.

CONSTRAINTS YOU ENFORCE:
- Songs must be 60-90 seconds when sung (HARD LIMIT)
- Maximum 5 sections: Hook + Verse + Chorus + Verse + Bridge
- Hook must appear in first 15 seconds and repeat every 8 bars
- ONE vivid mental image per verse maximum
- Verses maximum 4 lines each

OUTPUT FORMAT (JSON):
{
  "hookPhraseCandidates": ["3-5 syllable hook phrases specific to the topic"],
  "imageryRecommendations": ["Concrete, visualizable images for this topic"],
  "compressionTips": ["How to say this topic's content in fewer words"],
  "structureAdvice": "Specific structure recommendation for this topic/age",
  "languageFlowNotes": "Language-specific flow recommendations"
}

Be SPECIFIC to the topic. Don't give generic advice.`;
}

/**
 * Generate tailored flow suggestions using Claude (agentic).
 */
export async function generateFlowSuggestions(
  topic: string,
  ageRange: AgeRange,
  technique: Technique,
  language: SupportedLanguage,
  context: GatheredContext
): Promise<FlowSuggestions> {
  const techniqueLibrary = await getTechniqueLibraryExcerpt();
  const systemPrompt = buildFlowExpertPrompt(techniqueLibrary);

  const userMessage = `Generate flow suggestions for:

TOPIC: ${topic}
AGE RANGE: ${ageRange[0]}-${ageRange[1]} years old
TECHNIQUE: ${technique}
LANGUAGE: ${language}

CONTEXT GATHERED:
- Core Concepts: ${context.coreConcepts.join(', ')}
- Key Facts: ${context.keyFacts.slice(0, 3).join('; ')}
- Curiosity Triggers: ${context.curiosityTriggers.join(', ')}

Provide specific, actionable suggestions for a 60-90 second song.
Make hook phrases catchy and topic-specific.
Make imagery concrete and visualizable.`;

  const response = await createMessage(systemPrompt, userMessage, {
    model: MODELS.ORCHESTRATOR,
    maxTokens: 1024,
    temperature: 0.6,
    agentName: 'flow-expert',
  });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in flow expert response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as FlowSuggestions;
    return parsed;
  } catch {
    // Fallback suggestions
    console.warn('Failed to parse flow suggestions, using fallback');
    return {
      hookPhraseCandidates: [`Learn ${topic}!`, `${topic} is cool!`],
      imageryRecommendations: ['Use concrete, visible objects related to the topic'],
      compressionTips: ['Use short phrases, not sentences'],
      structureAdvice: 'Hook-Verse-Chorus-Verse-Chorus structure',
      languageFlowNotes: 'Match syllables to beat, keep it singable',
    };
  }
}

// ============================================================================
// MAIN EXPORT: Coordinate Flow Guidance
// ============================================================================

/**
 * Generate complete flow guidance for the lyrics agent.
 * HYBRID: Scriptic constraints + Agentic suggestions.
 */
export async function coordinateFlowGuidance(
  topic: string,
  ageRange: AgeRange,
  technique: Technique,
  language: SupportedLanguage,
  context: GatheredContext
): Promise<FlowGuidance> {
  // SCRIPTIC: Load constraints (no API call)
  const constraints = loadFlowConstraints();

  // AGENTIC: Generate suggestions (Claude call)
  const suggestions = await generateFlowSuggestions(
    topic,
    ageRange,
    technique,
    language,
    context
  );

  // Build coordinator guidance for lyrics-agent prompt injection
  const coordinatorGuidance = buildCoordinatorGuidance(constraints, suggestions);

  return {
    constraints,
    suggestions,
    coordinatorGuidance,
  };
}

/**
 * Build the guidance string for lyrics-agent prompt injection.
 */
function buildCoordinatorGuidance(
  constraints: FlowConstraints,
  suggestions: FlowSuggestions
): string {
  return `
---SONG FLOW MASTERY GUIDANCE---

HARD CONSTRAINTS (you MUST follow):
- Duration: ${constraints.duration.targetSeconds}s target, ${constraints.duration.maxSeconds}s max
- Structure: Max ${constraints.structure.maxSections} sections
- Hook: Every ${constraints.structure.hookFrequency} bars, repeat ${constraints.repetition.hookRepeats}x
- Verses: Max ${constraints.structure.verseMaxLines} lines each
- Imagery: ${constraints.imagery.maxPerVerse} vivid image per verse max

HOOK PHRASE CANDIDATES (pick one or adapt):
${suggestions.hookPhraseCandidates.map(h => `- "${h}"`).join('\n')}

IMAGERY RECOMMENDATIONS:
${suggestions.imageryRecommendations.map(i => `- ${i}`).join('\n')}

COMPRESSION TIPS:
${suggestions.compressionTips.map(t => `- ${t}`).join('\n')}

STRUCTURE ADVICE:
${suggestions.structureAdvice}

LANGUAGE FLOW:
${suggestions.languageFlowNotes}

REMEMBER: Shorter is better. Vivid beats verbose. Hook early, hook often.
---END FLOW GUIDANCE---
`;
}

/**
 * Clear the Mastery Brain cache.
 */
export function clearFlowCache(): void {
  masteryBrainCache = null;
}
