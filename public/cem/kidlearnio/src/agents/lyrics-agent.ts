import type { AgentDocuments, GatheredContext, AgeRange, Technique } from '@/types';
import { createMessage, MODELS, TOKEN_LIMITS } from '@/lib/anthropic';
import { getDocumentExcerpt } from '@/lib/document-loader';

/**
 * Build the lyrics agent system prompt.
 */
export function buildLyricsAgentPrompt(docs: AgentDocuments): string {
  return `You are the LYRICS AGENT of KidLearnio.
Your job is to write educational song lyrics that spark curiosity and teach effectively.

CORE DOCUMENTS:

---CURIOSITY TECHNIQUES---
${getDocumentExcerpt(docs.curiosity, 3000)}

---PEDAGOGICAL APPROACH---
${getDocumentExcerpt(docs.pedagogy, 3000)}

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
 */
export async function generateLyrics(
  docs: AgentDocuments,
  context: GatheredContext,
  technique: Technique,
  ageRange: AgeRange,
  curiosityTechnique: string
): Promise<string> {
  const systemPrompt = buildLyricsAgentPrompt(docs);

  const userMessage = `
Generate educational song lyrics using the following context:

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

Write the complete lyrics now. Follow the ${technique === 'memorization' ? 'memorization structure' : '6-layer connection structure'}.`;

  const lyrics = await createMessage(systemPrompt, userMessage, {
    model: MODELS.LYRICS_AGENT,
    maxTokens: TOKEN_LIMITS.LYRICS_OUTPUT,
    temperature: 0.8, // Slightly higher for creativity
  });

  return lyrics.trim();
}

/**
 * Refine lyrics based on feedback.
 */
export async function refineLyrics(
  docs: AgentDocuments,
  originalLyrics: string,
  feedback: string,
  ageRange: AgeRange
): Promise<string> {
  const systemPrompt = buildLyricsAgentPrompt(docs);

  const userMessage = `
Here are lyrics that need refinement:

---ORIGINAL LYRICS---
${originalLyrics}
---END LYRICS---

FEEDBACK:
${feedback}

AGE RANGE: ${ageRange[0]}-${ageRange[1]}

Rewrite the lyrics addressing the feedback while maintaining the educational content and song structure.`;

  const refined = await createMessage(systemPrompt, userMessage, {
    model: MODELS.LYRICS_AGENT,
    maxTokens: TOKEN_LIMITS.LYRICS_OUTPUT,
    temperature: 0.7,
  });

  return refined.trim();
}
