import type {
  AgentDocumentsWithBrain,
  GatheredContext,
  AgeRange,
  Technique,
} from '@/types';
import { createMessage, MODELS, TOKEN_LIMITS } from '@/lib/anthropic';
import { getDocumentExcerpt } from '@/lib/document-loader';
import type { StickProcessorResult } from '@/lib/stick-processor';

/**
 * Build the lyrics agent system prompt WITH language brain and stick outputs.
 * ENFORCEMENT: Language brain MUST be loaded before this function is called.
 */
export function buildLyricsAgentPrompt(
  docs: AgentDocumentsWithBrain,
  stickResults?: StickProcessorResult
): string {
  const brain = docs.languageBrain;

  // ENFORCEMENT: Fail fast if no brain
  if (!brain || !brain.rawDocument) {
    throw new Error(
      'ENFORCEMENT FAILURE: Language brain not loaded. ' +
      'Cannot generate lyrics without loading language brain first. ' +
      'Use loadAgentDocumentsWithBrain() instead of loadAgentDocuments().'
    );
  }

  // Build coordinator guidance section if coordinators produced output
  const curiosityGuidance = stickResults?.coordinators?.curiosity?.coordinatorGuidance
    ? `
${stickResults.coordinators.curiosity.coordinatorGuidance}
`
    : '';

  // Flow guidance from Song Flow Expert (hybrid coordinator)
  const flowGuidance = stickResults?.coordinators?.flow?.coordinatorGuidance
    ? `
${stickResults.coordinators.flow.coordinatorGuidance}
`
    : '';

  const coordinatorGuidance = curiosityGuidance + flowGuidance;

  // Build stick guidance section if sticks were processed
  const stickGuidance = stickResults
    ? `
═══════════════════════════════════════════════════════════════════════════════
LOGIC STICKS PRE-COMPUTED GUIDANCE (from @humanitic/logic-sticks)
═══════════════════════════════════════════════════════════════════════════════

${stickResults.promptEnhancements.vocabularyGuidance}

${stickResults.promptEnhancements.structureGuidance}

${stickResults.promptEnhancements.languageGuidance}

${stickResults.promptEnhancements.curiosityGuidance}

${stickResults.promptEnhancements.singabilityGuidance}

${stickResults.promptEnhancements.choreographyGuidance}
${coordinatorGuidance}
STICK ENFORCEMENT: Follow these pre-computed rules EXACTLY. These constraints
come from domain experts (musicians, educators, dance teachers) and represent
accumulated pedagogical wisdom. A song that violates these rules will not work.

CRITICAL: Output a SONG, not a poem. Keep lines short. Keep it singable.
═══════════════════════════════════════════════════════════════════════════════
`
    : '';

  return `You are the LYRICS AGENT of KidLearnio.
Your job is to write educational song lyrics that spark curiosity and teach effectively.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL: BRAINS BEFORE MOUTHS — Language-Native Generation
═══════════════════════════════════════════════════════════════════════════════

You are generating lyrics in: ${brain.name} (${brain.code})

COGNITIVE PATTERNS FOR THIS LANGUAGE:
- Agent Focus: ${brain.cognitiveSemantics.agentFocus}
- Topic-Prominent: ${brain.cognitiveSemantics.topicProminent}
- Evidentiality Markers: ${brain.cognitiveSemantics.evidentiality}
- Word Order: ${brain.features.wordOrder}
- Agglutinative: ${brain.features.agglutinative}
- Tonal: ${brain.features.tonal}

LANGUAGE-SPECIFIC GUIDE:
${getDocumentExcerpt(brain.rawDocument, 4000)}

ENFORCEMENT RULES:
1. NEVER generate in English first then translate
2. THINK in ${brain.name} — use native cognitive patterns
3. USE native idioms, proverbs, wordplay (NOT translated)
4. APPLY language-specific rhyme patterns
5. RESPECT morphological rules (e.g., vowel harmony for Turkish)
6. MATCH native rhythm patterns (syllable count for Turkish/Chinese, stress for English)

═══════════════════════════════════════════════════════════════════════════════
${stickGuidance}
CORE DOCUMENTS:

---CURIOSITY TECHNIQUES---
${getDocumentExcerpt(docs.curiosity, 2500)}

---PEDAGOGICAL APPROACH---
${getDocumentExcerpt(docs.pedagogy, 2500)}

YOUR RULES:

═══════════════════════════════════════════════════════════════════════════════
HARD LIMITS (from Song Flow Expert — DO NOT EXCEED):
═══════════════════════════════════════════════════════════════════════════════
- DURATION: 60-90 seconds when sung (MAXIMUM)
- SECTIONS: Maximum 5 total (e.g., Hook + Verse + Chorus + Verse + Bridge)
- VERSES: Maximum 4 lines each
- IMAGERY: 1 vivid mental image per verse (no more)
- HOOK: Must appear in first 15 seconds, repeat every 8 bars
═══════════════════════════════════════════════════════════════════════════════

FOR MEMORIZATION SONGS:
- Start with hook immediately (first 4 lines)
- Use techniques: acronyms, rhyme encoding, rhythm chunking
- Keep chorus VERY simple (2-4 lines max)
- Include [clap], [stomp] on key words only
- Repeat key facts 4+ times
- Structure: [Hook] [Verse 1] [Chorus] [Verse 2] [Chorus] — THAT'S ALL

FOR CONNECTION SONGS:
- Compressed 4-layer structure:
  1. [Hook] - Curiosity trigger + core concept preview
  2. [Verse] - Bridge from known to unknown (4 lines max)
  3. [Chorus] - Core concept (simple, memorable)
  4. [Bridge] - Real world application
- Core concept repeated 3+ times

VOCABULARY RULES:
- Ages 5-7: Simple concrete words only, 5-7 word sentences
- Ages 8-10: Can introduce technical terms WITH bridges, 7-10 word sentences
- Ages 11-14: Technical terms with context OK, 10+ word sentences fine

ALWAYS:
- SHORTER IS BETTER — cut ruthlessly
- ONE image per verse (make it vivid and concrete)
- Hook phrase: 3-5 syllables, catchy, repeatable
- Use [Verse], [Chorus], [Bridge] markers only
- NO tempo notes, NO rhythm suggestions, NO movement suggestions

OUTPUT FORMAT:
Return ONLY the lyrics with structure markers. Nothing else. Be BRIEF.`;
}

/**
 * Generate lyrics for an educational song.
 * ENFORCEMENT: docs MUST contain languageBrain (use loadAgentDocumentsWithBrain).
 */
export async function generateLyrics(
  docs: AgentDocumentsWithBrain,
  context: GatheredContext,
  technique: Technique,
  ageRange: AgeRange,
  curiosityTechnique: string,
  stickResults?: StickProcessorResult
): Promise<string> {
  // ENFORCEMENT: buildLyricsAgentPrompt will throw if brain not loaded
  const systemPrompt = buildLyricsAgentPrompt(docs, stickResults);

  const brain = docs.languageBrain;

  const userMessage = `
Generate educational song lyrics in ${brain.name} (${brain.code}) using the following context:

LANGUAGE: ${brain.name}
TECHNIQUE: ${technique.toUpperCase()}
CURIOSITY APPROACH: ${curiosityTechnique}
AGE RANGE: ${ageRange[0]}-${ageRange[1]} years old

GATHERED CONTEXT:
- Core Concepts: ${context.coreConcepts.join(', ')}
- Key Facts: ${context.keyFacts.join(', ')}
- Real World Connections: ${context.realWorldConnections.join(', ')}
- Curiosity Triggers: ${context.curiosityTriggers.join(', ')}
- Vocabulary Level: ${context.ageAdaptations.vocabularyLevel}
- Complexity: ${context.ageAdaptations.complexity}
- Metaphor Sources: ${context.ageAdaptations.metaphorSources.join(', ')}

CRITICAL REMINDERS FOR ${brain.name.toUpperCase()}:
${brain.code === 'tr' ? `
- Use SOV word order (yüklem sonda)
- Apply vowel harmony (ünlü uyumu)
- Use native deyimler and atasözleri
- Maintain hece ölçüsü (syllable meter)
` : brain.code === 'zh' ? `
- Use topic-prominent structure
- Include 四字格 (four-character phrases)
- Use 叠词 (reduplication) for rhythm
- Apply native 成语 and 谚语
` : `
- Use active voice with clear agent
- Apply stress-timed rhythm
- Use native idioms and wordplay
- Match word stress to melody
`}

Write the complete lyrics now in ${brain.name}. Follow the ${technique === 'memorization' ? 'memorization structure' : '6-layer connection structure'}.`;

  const lyrics = await createMessage(systemPrompt, userMessage, {
    model: MODELS.LYRICS_AGENT,
    maxTokens: TOKEN_LIMITS.LYRICS_OUTPUT,
    temperature: 0.8, // Slightly higher for creativity
  });

  return lyrics.trim();
}

/**
 * Refine lyrics based on feedback.
 * ENFORCEMENT: docs MUST contain languageBrain.
 */
export async function refineLyrics(
  docs: AgentDocumentsWithBrain,
  originalLyrics: string,
  feedback: string,
  ageRange: AgeRange
): Promise<string> {
  const systemPrompt = buildLyricsAgentPrompt(docs);
  const brain = docs.languageBrain;

  const userMessage = `
Here are ${brain.name} lyrics that need refinement:

---ORIGINAL LYRICS---
${originalLyrics}
---END LYRICS---

FEEDBACK:
${feedback}

LANGUAGE: ${brain.name}
AGE RANGE: ${ageRange[0]}-${ageRange[1]}

Rewrite the lyrics in ${brain.name}, addressing the feedback while:
- Maintaining educational content and song structure
- Using native ${brain.name} patterns (NOT translated patterns)
- Keeping idioms and wordplay in native form`;

  const refined = await createMessage(systemPrompt, userMessage, {
    model: MODELS.LYRICS_AGENT,
    maxTokens: TOKEN_LIMITS.LYRICS_OUTPUT,
    temperature: 0.7,
  });

  return refined.trim();
}
