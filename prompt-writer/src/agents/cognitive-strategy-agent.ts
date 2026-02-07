import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import {
  type PromptRequest,
  type CSAStrategy,
  CSAStrategySchema,
} from "@/types";

function loadDocument(filename: string): string {
  const candidates = [
    join(process.cwd(), "docs", filename),
    join(process.cwd(), "..", "docs", filename),
  ];

  for (const filepath of candidates) {
    try {
      return readFileSync(filepath, "utf-8");
    } catch {
      // try next candidate
    }
  }

  console.warn(`[CSA] Document not found: ${filename}`);
  return `[Document ${filename} not found]`;
}

function loadAllDocuments(): string {
  const thoughtPipelines = loadDocument("thought-pipelines.md");
  const logicSticks = loadDocument("logic-sticks.md");
  const curiositySparking = loadDocument("curiosity-sparking-techniques.md");
  const memorization = loadDocument("memorization-techniques.md");

  return `
=== THOUGHT PIPELINES ===
${thoughtPipelines}

=== LOGIC STICKS ===
${logicSticks}

=== CURIOSITY SPARKING TECHNIQUES ===
${curiositySparking}

=== MEMORIZATION TECHNIQUES ===
${memorization}
`;
}

function sanitizeInput(text: string): string {
  return text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
}

function parseLLMJson(raw: string): unknown {
  let text = raw.trim();
  // Strip code fences
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  // Strip trailing commas before } or ]
  text = text.replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(text);
}

const CSA_SYSTEM_PROMPT = `You are the Cognitive Strategy Agent (CSA) — the gatekeeper of the Suno Prompt Writer system.

YOUR ROLE: Before ANY prompt is generated, YOU decide the cognitive strategy. Every agent consults you first. You are the bridge between raw educational content and curiosity-driven musical learning.

You have access to four foundational documents that define your decision framework. READ THEM CAREFULLY.

YOUR RESPONSIBILITIES:
1. SELECT the appropriate Thought Pipeline based on subject + age group + learning approach
2. SELECT the Logic Stick that will structure the song's logical spine
3. SELECT 1-2 Curiosity Sparking Techniques to ignite engagement
4. If memorization approach: SELECT the Memorization Technique
5. DETERMINE the emotional arc of the song
6. RECOMMEND a musical style direction
7. APPROVE or REDIRECT the approach

YOUR OUTPUT must be a valid JSON object matching the CSAStrategy schema:
{
  "pipeline": one of ["wonder-question-discovery", "pattern-rhythm-recall", "story-character-lesson", "connect-layer-integrate", "play-explore-build"],
  "logicStick": one of ["ladder", "mirror", "zoom", "anchor", "rhythm-lock", "web"],
  "curiosityTechniques": array of 1-2 from ["impossible-fact", "unanswered-question", "personal-stake", "pattern-reveal", "wrong-answer", "tiny-giant", "time-machine"],
  "memorizationTechnique": (optional, only if memorization approach) one of ["acronym-songs", "rhyme-chains", "counting-songs", "body-mapping", "story-mnemonics", "call-and-response"],
  "emotionalArc": string describing the emotional journey,
  "reasoning": string explaining your choices,
  "approved": boolean,
  "redirectReason": (optional) string if not approved,
  "styleRecommendation": {
    "genre": string,
    "mood": string,
    "tempoRange": string,
    "vocalSuggestion": string
  }
}

RESPOND WITH ONLY THE JSON OBJECT. No markdown, no code fences, no explanation outside the JSON.`;

export async function consultCSA(
  request: PromptRequest,
  sessionHistory?: string
): Promise<CSAStrategy> {
  const client = new Anthropic();
  const documents = loadAllDocuments();

  const subject = sanitizeInput(request.subject);
  const context = sanitizeInput(request.additionalContext || "None provided");

  const userMessage = `
EDUCATIONAL REQUEST:
- Subject: ${subject}
- Age Group: ${request.ageGroup}
- Learning Approach: ${request.learningApproach}
- Additional Context: ${context}

${sessionHistory ? `SESSION HISTORY:\n${sessionHistory}` : "No previous session history."}

FOUNDATIONAL DOCUMENTS:
${documents}

Based on these documents and the request, determine the optimal cognitive strategy. Remember:
- If age ≤ 6: PREFER Pipeline 1 (wonder-question-discovery) or 5 (play-explore-build)
- If math subject: CONSIDER Pipeline 2 (pattern-rhythm-recall)
- If learning approach is "six-layer-andragogy": USE Pipeline 4 (connect-layer-integrate)
- If learning approach is "memorization": USE Pipeline 2 (pattern-rhythm-recall) and SELECT a memorization technique
- ALWAYS select curiosity techniques appropriate for the age group
- The SECRET IS CURIOSITY. Every choice must serve the spark.

Output your strategy as a JSON object.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1500,
    system: CSA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("CSA returned no text response");
  }

  const parsed = parseLLMJson(textContent.text);
  return CSAStrategySchema.parse(parsed);
}

export { parseLLMJson, sanitizeInput };
