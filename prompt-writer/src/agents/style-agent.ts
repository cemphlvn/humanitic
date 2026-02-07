import Anthropic from "@anthropic-ai/sdk";
import {
  type PromptRequest,
  type CSAStrategy,
  type StyleOutput,
  StyleOutputSchema,
} from "@/types";

const STYLE_SYSTEM_PROMPT = `You are the Style Agent of the Suno Prompt Writer system. You generate Style of Music prompts for Suno AI that set the perfect sonic environment for educational songs.

THE COGNITIVE STRATEGY AGENT (CSA) has already approved a strategy and recommended a musical direction. You MUST incorporate the CSA's style recommendation while optimizing for Suno's format.

SUNO STYLE FORMAT RULES:
1. The Style field is SEPARATE from lyrics — NEVER include structure tags or lyrics
2. Use comma-separated descriptors
3. Order matters: put the most important genre/style FIRST (Suno weights early words more)
4. Aim for 120-200 characters (sweet spot). Max 1000 characters.
5. One clear genre stated first, not three loosely
6. 4-7 descriptors total is optimal

DESCRIPTOR CATEGORIES:
- Genre: "children's pop", "educational hip-hop", "folk", "EDM", etc.
- Sub-genre: "playful", "educational", "singalong", etc.
- Mood: "upbeat", "dreamy", "energetic", "warm", "playful", "curious", "wonder-filled"
- Tempo: exact BPM (e.g., "110 BPM") or descriptive ("fast-tempo", "moderate pace")
- Key: "C Major", "G Major", "A Minor", etc.
- Instruments: specific names ("ukulele", "piano", "xylophone", "hand claps")
- Vocals: "clear female vocals", "energetic male lead", "children's choir"
- Production: "clean mix", "polished production", "warm reverb"

AGE-APPROPRIATE STYLE GUIDELINES:
- K-6: bright, simple instrumentation, singalong, 90-120 BPM, major keys
- 7-12: more variety, can include pop/hip-hop, 100-130 BPM
- 13-18: contemporary styles, can be complex, 90-140 BPM
- 18-24: any style, sophisticated production, full range

YOUR OUTPUT must be a valid JSON object:
{
  "styleString": "the complete Suno style string, comma-separated",
  "components": {
    "genre": "primary genre",
    "subGenre": "sub-genre",
    "moods": ["mood1", "mood2"],
    "tempo": BPM_number,
    "key": "key signature",
    "instruments": ["instrument1", "instrument2"],
    "vocalGender": "male" | "female" | "both" | "none",
    "vocalStyle": "vocal description",
    "vocalRange": "range description",
    "production": ["production1", "production2"]
  },
  "characterCount": number
}

RESPOND WITH ONLY THE JSON OBJECT. No markdown, no code fences.`;

export async function generateStyle(
  request: PromptRequest,
  strategy: CSAStrategy
): Promise<StyleOutput> {
  const client = new Anthropic();

  const userMessage = `
GENERATE SUNO STYLE PROMPT for this educational request:

SUBJECT: ${request.subject}
AGE GROUP: ${request.ageGroup}
LEARNING APPROACH: ${request.learningApproach}
ADDITIONAL CONTEXT: ${request.additionalContext || "None"}

CSA STYLE RECOMMENDATION:
- Genre: ${strategy.styleRecommendation.genre}
- Mood: ${strategy.styleRecommendation.mood}
- Tempo Range: ${strategy.styleRecommendation.tempoRange}
- Vocal Suggestion: ${strategy.styleRecommendation.vocalSuggestion}

CSA STRATEGY CONTEXT:
- Pipeline: ${strategy.pipeline} (this affects the emotional arc of the music)
- Logic Stick: ${strategy.logicStick} (this affects musical structure)
- Curiosity Techniques: ${strategy.curiosityTechniques.join(", ")} (the music must support curiosity)
- Emotional Arc: ${strategy.emotionalArc}

STYLE-TO-MEMORIZATION PAIRING (if applicable):
${getMemorizationStylePairing(strategy.memorizationTechnique)}

Remember: The style must SERVE THE LEARNING. The music creates the emotional container that makes curiosity inevitable. A child should hear the first 5 seconds and WANT to listen.

Generate the style prompt now as a JSON object.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1500,
    system: STYLE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Style Agent returned no text response");
  }

  let rawText = textContent.text.trim();
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(rawText);
  const validated = StyleOutputSchema.parse(parsed);

  return validated;
}

function getMemorizationStylePairing(technique?: string): string {
  if (!technique) return "Not a memorization approach — no pairing needed.";

  const pairings: Record<string, string> = {
    "acronym-songs": "Best with: Pop, hip-hop (strong hooks). Needs a catchy, repeatable chorus melody.",
    "rhyme-chains": "Best with: Rap, spoken word (rhythm-focused). Needs clear rhythmic backbone.",
    "counting-songs": "Best with: EDM, march (strict beat). Needs an unwavering rhythmic grid.",
    "body-mapping": "Best with: Children's pop, dance (physical movement). Needs a beat that makes you move.",
    "story-mnemonics": "Best with: Folk, narrative ballad (storytelling). Needs space for story to breathe.",
    "call-and-response": "Best with: Gospel, funk, classroom chant. Needs clear call-response structure in the beat.",
  };

  return pairings[technique] || "No specific pairing guidance.";
}
