import Anthropic from "@anthropic-ai/sdk";
import {
  type PromptRequest,
  type CSAStrategy,
  type LyricsOutput,
  LyricsOutputSchema,
} from "@/types";

const LYRICS_SYSTEM_PROMPT = `You are the Lyrics Agent of the Suno Prompt Writer system. You generate structured song lyrics for Suno AI that teach educational concepts to children through music.

THE COGNITIVE STRATEGY AGENT (CSA) has already approved a strategy for this generation. You MUST follow its decisions exactly:
- Use the selected Thought Pipeline to structure the song's cognitive flow
- Use the selected Logic Stick as the song's logical spine
- Apply the selected Curiosity Sparking Technique(s) at the right moments
- If a Memorization Technique was selected, implement it
- Follow the emotional arc prescribed by the CSA

SUNO LYRICS FORMAT RULES:
1. Use [square brackets] for ALL section tags: [Intro], [Verse 1], [Chorus], [Bridge], [Outro], etc.
2. Vocal/delivery tags go INSIDE section brackets, comma-separated: [Verse 1, Female Vocal, Soft]
3. Keep 4 lines per verse, 2-4 lines per chorus
4. Aim for 6-12 syllables per line
5. Use vowel elongation for sustained notes: "lo-o-o-ove", "Ohhhh"
6. CAPITALIZATION increases intensity/volume on those words
7. Available section tags: [Intro], [Instrumental Intro], [Verse], [Verse 1], [Verse 2], [Pre-Chorus], [Chorus], [Post-Chorus], [Hook], [Bridge], [Interlude], [Break], [Build], [Drop], [Final Chorus], [Outro], [Fade Out]
8. Available vocal tags: [Male Vocal], [Female Vocal], [Whisper], [Spoken Word], [Narration], [Rapped], [Falsetto], [Belting], [Soft], [Powerful], [Echoing Vocals], [Layered Vocal Harmonies]
9. Available energy tags: [Building Intensity], [Climactic], [Explosive Chorus], [Soft Intro], [Quiet Verse], [Big Finish]
10. Total lyrics should stay under 3000 characters for optimal Suno processing

YOUR OUTPUT must be a valid JSON object:
{
  "lyrics": "the full lyrics string with all Suno tags",
  "sections": [{"tag": "[Verse 1, Soft]", "content": "lyrics text..."}],
  "characterCount": number,
  "curiosityHook": "the specific curiosity-sparking line/moment"
}

The lyrics must be SCIENTIFICALLY ACCURATE, AGE-APPROPRIATE, and genuinely FUN to sing.
RESPOND WITH ONLY THE JSON OBJECT. No markdown, no code fences.`;

export async function generateLyrics(
  request: PromptRequest,
  strategy: CSAStrategy
): Promise<LyricsOutput> {
  const client = new Anthropic();

  const userMessage = `
GENERATE SUNO LYRICS for this educational request:

SUBJECT: ${request.subject}
AGE GROUP: ${request.ageGroup}
LEARNING APPROACH: ${request.learningApproach}
ADDITIONAL CONTEXT: ${request.additionalContext || "None"}

CSA-APPROVED STRATEGY:
- Thought Pipeline: ${strategy.pipeline}
- Logic Stick: ${strategy.logicStick}
- Curiosity Techniques: ${strategy.curiosityTechniques.join(", ")}
${strategy.memorizationTechnique ? `- Memorization Technique: ${strategy.memorizationTechnique}` : ""}
- Emotional Arc: ${strategy.emotionalArc}
- CSA Reasoning: ${strategy.reasoning}
- Recommended Genre: ${strategy.styleRecommendation.genre}
- Recommended Mood: ${strategy.styleRecommendation.mood}
- Recommended Vocal: ${strategy.styleRecommendation.vocalSuggestion}

PIPELINE MAPPING (follow the structure for "${strategy.pipeline}"):
${getPipelineMapping(strategy.pipeline)}

LOGIC STICK PATTERN (use "${strategy.logicStick}" as the logical spine):
${getLogicStickPattern(strategy.logicStick)}

Remember: THE SECRET IS CURIOSITY. The song must make a child lean forward and ask "why?" — and then sing the answer.

Generate the lyrics now as a JSON object.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 3000,
    system: LYRICS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Lyrics Agent returned no text response");
  }

  let rawText = textContent.text.trim();
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(rawText);
  const validated = LyricsOutputSchema.parse(parsed);

  return validated;
}

function getPipelineMapping(pipeline: string): string {
  const mappings: Record<string, string> = {
    "wonder-question-discovery": `[Intro] → WONDER moment
[Verse 1] → Astonishing fact / observation
[Pre-Chorus] → Natural question that arises
[Chorus] → The DISCOVERY — the "aha!" moment
[Verse 2] → Deeper layer / second wonder
[Bridge] → Connection to something familiar
[Final Chorus] → OWNERSHIP — "I understand this now"
[Outro] → Callback to original wonder`,

    "pattern-rhythm-recall": `[Intro] → Rhythmic hook that IS the pattern
[Verse 1] → First examples set to the pattern
[Chorus] → The rule/formula as a singable hook
[Verse 2] → More examples, increasing complexity
[Chorus] → Repetition locks it in
[Bridge] → "Now YOU try" — interactive moment
[Final Chorus] → Full confidence recall`,

    "story-character-lesson": `[Intro] → Setting the scene
[Verse 1] → Character introduction + situation
[Verse 2] → The challenge / conflict / question
[Chorus] → Core lesson as emotional declaration
[Verse 3] → Resolution / what happened
[Bridge] → "What would YOU do?" — personal connection
[Final Chorus] → The lesson resonates personally
[Outro] → Echo of opening, transformed`,

    "connect-layer-integrate": `[Intro] → The familiar connection
[Verse 1] → Layer 1 — observable facts
[Verse 2] → Layer 2 — the mechanism
[Pre-Chorus] → Layer 3 — the principle
[Chorus] → The unified understanding
[Verse 3] → Layer 4 — cross-connections
[Bridge] → Layer 5+6 — synthesis + implications
[Final Chorus] → INTEGRATION — everything clicks
[Outro] → Return to the familiar, now transformed`,

    "play-explore-build": `[Intro] → Playful sounds that become sense
[Verse 1] → Playing with the concept
[Chorus] → The pattern discovered, celebrated
[Verse 2] → Building with the pattern
[Bridge] → Surprise twist / unexpected connection
[Final Chorus] → Singing together — shared knowledge`,
  };
  return mappings[pipeline] || mappings["wonder-question-discovery"];
}

function getLogicStickPattern(stick: string): string {
  const patterns: Record<string, string> = {
    ladder: "A → B → C → D: Each step builds on the previous. Sequential, cause-and-effect.",
    mirror: "A ↔ B: Two things compared side by side. Same structure, different content. Chorus reveals connection.",
    zoom: "Macro → Micro → Macro: Zoom in to the smallest detail, then zoom back out with new understanding.",
    anchor: "Known → Unknown → Known+: Start familiar, go strange, return enriched.",
    "rhythm-lock": "Pattern → Repetition → Variation → Lock: Rhythmic pattern that becomes automatic through repetition.",
    web: "Center → Spoke 1 → Spoke 2 → Spoke 3 → Center+: Central concept with multiple connections radiating out.",
  };
  return patterns[stick] || patterns["ladder"];
}
