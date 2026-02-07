import {
  type MemoryEntry,
  type PromptRequest,
  type CSAStrategy,
  type LyricsOutput,
  type StyleOutput,
  MemoryEntrySchema,
} from "@/types";

/**
 * Memory Agent — Cognee-powered session memory layer
 *
 * This agent stores and retrieves session context for the pipeline.
 * It uses a local storage layer with Cognee-compatible structure,
 * enabling knowledge graph memory across sessions.
 *
 * The memory serves three purposes:
 * 1. Session History — what was generated before in this session
 * 2. Topic Connections — how subjects relate to each other
 * 3. Engagement Patterns — what approaches worked (for CSA to reference)
 */

// ─── In-Memory Store (replaced by Cognee in production) ───
interface MemoryStore {
  entries: MemoryEntry[];
  topicGraph: Map<string, Set<string>>;
}

const store: MemoryStore = {
  entries: [],
  topicGraph: new Map(),
};

export function storeSession(
  request: PromptRequest,
  strategy: CSAStrategy,
  lyrics?: LyricsOutput,
  style?: StyleOutput
): MemoryEntry {
  const entry: MemoryEntry = {
    sessionId: generateSessionId(),
    subject: request.subject,
    ageGroup: request.ageGroup,
    approach: request.learningApproach,
    pipeline: strategy.pipeline,
    logicStick: strategy.logicStick,
    curiosityTechniques: strategy.curiosityTechniques,
    generatedLyrics: lyrics?.lyrics,
    generatedStyle: style?.styleString,
    timestamp: new Date().toISOString(),
    topicConnections: extractTopicConnections(request.subject),
  };

  const validated = MemoryEntrySchema.parse(entry);
  store.entries.push(validated);

  // Update topic graph
  const connections = validated.topicConnections;
  for (const topic of connections) {
    if (!store.topicGraph.has(topic)) {
      store.topicGraph.set(topic, new Set());
    }
    const topicSet = store.topicGraph.get(topic);
    if (topicSet) {
      for (const other of connections) {
        if (other !== topic) {
          topicSet.add(other);
        }
      }
    }
  }

  return validated;
}

export function getSessionHistory(limit: number = 5): string {
  const recent = store.entries.slice(-limit);
  if (recent.length === 0) return "";

  return recent
    .map(
      (e) =>
        `- Subject: ${e.subject} | Age: ${e.ageGroup} | Pipeline: ${e.pipeline} | Stick: ${e.logicStick} | Curiosity: ${e.curiosityTechniques.join(", ")} | Time: ${e.timestamp}`
    )
    .join("\n");
}

export function getRelatedTopics(subject: string): string[] {
  const connections = extractTopicConnections(subject);
  const related = new Set<string>();

  for (const topic of connections) {
    const linked = store.topicGraph.get(topic);
    if (linked) {
      for (const l of linked) {
        related.add(l);
      }
    }
  }

  return Array.from(related).filter(
    (t) => !connections.includes(t)
  );
}

export function getAllSessions(): MemoryEntry[] {
  return [...store.entries];
}

export function getSessionById(sessionId: string): MemoryEntry | undefined {
  return store.entries.find((e) => e.sessionId === sessionId);
}

// ─── Helpers ───

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function extractTopicConnections(subject: string): string[] {
  // Extract key topic words from the subject
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "can", "shall",
    "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "and", "or", "but", "not", "no", "if", "then", "than",
    "this", "that", "these", "those", "it", "its", "how", "what",
    "why", "when", "where", "which", "who", "whom",
  ]);

  return subject
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length > 0);
}

/**
 * Cognee Integration Layer
 *
 * When Cognee is configured, this replaces the in-memory store:
 *
 * import cognee from "cognee";
 *
 * export async function storeWithCognee(entry: MemoryEntry) {
 *   await cognee.add(JSON.stringify(entry), "session_memory");
 *   await cognee.cognify();
 * }
 *
 * export async function searchCognee(query: string) {
 *   const results = await cognee.search("INSIGHTS", { query });
 *   return results;
 * }
 *
 * Configuration:
 *   cognee.config.setLLMConfig({
 *     provider: "anthropic",
 *     model: "claude-sonnet-4-5-20250929",
 *     apiKey: process.env.ANTHROPIC_API_KEY,
 *   });
 */
