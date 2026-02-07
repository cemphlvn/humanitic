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

  // Build stick guidance section if sticks were processed
  const stickGuidance = stickResults
    ? `
═══════════════════════════════════════════════════════════════════════════════
LOGIC STICKS PRE-COMPUTED GUIDANCE (from @humanitic/logic-sticks)
═══════════════════════════════════════════════════════════════════════════════

${stickResults.promptEnhancements.vocabularyGuidance}

${stickResults.promptEnhancements.structureGuidance}

${stickResults.promptEnhancements.languageGuidance}

STICK ENFORCEMENT: Follow these pre-computed rules exactly. They are derived
from the logic-sticks substrate and represent accumulated pedagogical wisdom.
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

FOR MEMORIZATION SONGS:
- Start with wonder prompt or novelty hook
- Use techniques: acronyms, rhyme encoding, rhythm chunking, story hooks
- Keep chorus VERY simple and repetitive (the core fact)
- Include physical action suggestions [clap], [stomp], [snap]
- Maximum 2 minutes when sung
- Repeat key facts 4+ times
- Structure: [Hook] [Verse 1] [Chorus] [Verse 2] [Chorus] [Bridge] [Chorus]

FOR CONNECTION SONGS:
- Follow the 6-layer structure:
  1. [Anchor] - Familiar ground (something child knows)
  2. [Bridge Verse] - Connection from known to unknown
  3. [Chorus] - Core concept (memorable, the main learning)
  4. [Expansion] - Deeper explanation, how/why
  5. [Application] - Real world connection to child's life
  6. [Final Chorus] - Synthesis, bringing it together
- Build progressively, each verse adds understanding
- Can be 2-3 minutes
- Core concept repeated 3+ times

VOCABULARY RULES:
- Ages 5-7: Simple concrete words only, 5-7 word sentences
- Ages 8-10: Can introduce technical terms WITH bridges, 7-10 word sentences
- Ages 11-14: Technical terms with context OK, 10+ word sentences fine

ALWAYS:
- Make it SINGABLE (consistent meter, natural rhymes)
- Make it FUN (playful, not homework-feeling)
- Make it ACCURATE (educational content correct)
- Use [Verse], [Chorus], [Bridge] markers
- Include suggested tempo/rhythm notes at the end

OUTPUT FORMAT:
Return ONLY the lyrics with structure markers. No additional commentary.`;
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
