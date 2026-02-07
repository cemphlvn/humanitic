import type { AgentDocuments, AgentDocumentsWithBrain, AgeRange, Technique } from '@/types';
import { createMessage, MODELS, TOKEN_LIMITS } from '@/lib/anthropic';
import { getDocumentExcerpt } from '@/lib/document-loader';

/**
 * Build the style agent system prompt.
 * Accepts either AgentDocuments or AgentDocumentsWithBrain.
 */
export function buildStyleAgentPrompt(docs: AgentDocuments | AgentDocumentsWithBrain): string {
  return `You are the STYLE AGENT of KidLearnio.
Your job is to craft Suno AI style prompts for educational children's songs.

SUNO STYLE GUIDE:
${getDocumentExcerpt(docs.sunoGuide, 4000)}

YOUR RULES:

THE 4-7 RULE:
- Always use 4-7 descriptors
- Too few = generic output
- Too many = confused output
- Sweet spot = 5-6 well-chosen descriptors

REQUIRED COMPONENTS:
1. Genre (age-appropriate)
2. Mood (matches learning technique)
3. Tempo (BPM range for age)
4. Instrumentation (kid-friendly)
5. Vocal style (clear, appropriate)
6. [Optional] Special elements (clapping, etc.)

AGE-APPROPRIATE GENRES:

Ages 5-7:
- nursery rhyme style
- children's pop
- playground chant
- bouncy children's music
AVOID: rock, electronic, anything "intense"

Ages 8-10:
- educational pop
- children's pop-rock
- folk-inspired children's
- upbeat acoustic
AVOID: heavy genres, complex arrangements

Ages 11-14:
- pop
- indie pop
- light rock
- contemporary folk
AVOID: explicit content genres

TECHNIQUE MATCHING:

MEMORIZATION songs need:
- Catchy, bouncy, repetitive
- Simple melody emphasis
- Clear beat for rhythm
- Sing-along friendly
Example: "catchy children's pop, bouncy and fun, 105 BPM, ukulele and piano with claps, clear child vocals, singalong chorus"

CONNECTION songs need:
- Building, layered, exploratory
- Dynamic progression
- Storytelling quality
- Expressive vocals
Example: "educational folk-pop, curious and wonder-filled, 100 BPM, acoustic guitar building to full arrangement, expressive storytelling vocals"

OUTPUT FORMAT:
Return ONLY the style prompt, nothing else. Single line, 4-7 descriptors, comma-separated.`;
}

/**
 * Generate a Suno style prompt.
 * Accepts either AgentDocuments or AgentDocumentsWithBrain.
 */
export async function generateStyle(
  docs: AgentDocuments | AgentDocumentsWithBrain,
  topic: string,
  technique: Technique,
  ageRange: AgeRange,
  mood?: string
): Promise<string> {
  const systemPrompt = buildStyleAgentPrompt(docs);

  const userMessage = `
Generate a Suno style prompt for:

TOPIC: ${topic}
TECHNIQUE: ${technique.toUpperCase()}
AGE RANGE: ${ageRange[0]}-${ageRange[1]} years old
${mood ? `MOOD PREFERENCE: ${mood}` : ''}

Create the style prompt now. Remember:
- 4-7 descriptors only
- Age-appropriate genre
- Technique-appropriate style
- Clear vocals for educational content`;

  const style = await createMessage(systemPrompt, userMessage, {
    model: MODELS.STYLE_AGENT,
    maxTokens: TOKEN_LIMITS.STYLE_OUTPUT,
    temperature: 0.6, // Lower for consistency
  });

  // Clean up - ensure single line, proper format
  const cleaned = style
    .trim()
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ');

  // Validate descriptor count
  const descriptorCount = cleaned.split(',').length;
  if (descriptorCount < 4 || descriptorCount > 7) {
    console.warn(`Style has ${descriptorCount} descriptors, expected 4-7`);
  }

  return cleaned;
}

/**
 * Validate a style prompt meets requirements.
 */
export function validateStylePrompt(style: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check descriptor count
  const descriptors = style.split(',').map((d) => d.trim());
  if (descriptors.length < 4) {
    issues.push(`Too few descriptors (${descriptors.length}, need 4+)`);
  }
  if (descriptors.length > 7) {
    issues.push(`Too many descriptors (${descriptors.length}, max 7)`);
  }

  // Check for required components (heuristic)
  const hasGenre = /pop|rock|folk|nursery|children|acoustic/i.test(style);
  const hasMood = /cheerful|bouncy|curious|playful|joyful|gentle|energetic/i.test(style);
  const hasTempo = /\d+\s*bpm|upbeat|moderate|slow/i.test(style);
  const hasVocals = /vocal|voice|singing|choir/i.test(style);

  if (!hasGenre) issues.push('Missing genre descriptor');
  if (!hasMood) issues.push('Missing mood descriptor');
  if (!hasTempo) issues.push('Missing tempo indication');
  if (!hasVocals) issues.push('Missing vocal style descriptor');

  // Check for inappropriate content
  const inappropriate = /explicit|aggressive|dark|heavy metal|punk rock/i.test(style);
  if (inappropriate) {
    issues.push('Contains inappropriate style for children');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Adjust style for specific age range.
 */
export function adjustStyleForAge(
  style: string,
  ageRange: AgeRange
): string {
  let adjusted = style;

  // Age-specific adjustments
  if (ageRange[0] <= 7) {
    // Younger kids: ensure simpler, more playful
    adjusted = adjusted.replace(/pop-rock/gi, 'pop');
    adjusted = adjusted.replace(/indie/gi, "children's");
    if (!/child|nursery|playful/i.test(adjusted)) {
      adjusted = adjusted.replace(/vocals?/i, 'sweet child vocals');
    }
  } else if (ageRange[0] >= 11) {
    // Older kids: can handle more complexity
    // No forced simplification needed
  }

  return adjusted;
}
