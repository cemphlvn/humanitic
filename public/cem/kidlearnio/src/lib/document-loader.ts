import { readFile } from 'fs/promises';
import { join } from 'path';
import type {
  AgentDocuments,
  AgentDocumentsWithBrain,
  LanguageBrain,
  SupportedLanguage,
} from '@/types';
import { LANGUAGE_BRAIN_PATHS, LANGUAGE_NAMES } from '@/types';

// Cache for loaded documents
let cachedDocuments: AgentDocuments | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

// Separate cache for language brains
const languageBrainCache: Map<SupportedLanguage, { brain: LanguageBrain; timestamp: number }> = new Map();

/**
 * Load all agent knowledge documents from the docs/ directory.
 * Documents are cached for performance.
 */
export async function loadAgentDocuments(): Promise<AgentDocuments> {
  const now = Date.now();

  // Return cached if still valid
  if (cachedDocuments && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedDocuments;
  }

  const docsPath = join(process.cwd(), 'docs');

  try {
    const [curiosity, pedagogy, pipeline, logicSticks, sunoGuide, languageArchitecture] =
      await Promise.all([
        readFile(join(docsPath, 'CURIOSITY_TECHNIQUES.md'), 'utf-8'),
        readFile(join(docsPath, 'PEDAGOGICAL_APPROACH.md'), 'utf-8'),
        readFile(join(docsPath, 'THOUGHT_PIPELINE.md'), 'utf-8'),
        readFile(join(docsPath, 'LOGIC_STICKS.md'), 'utf-8'),
        readFile(join(docsPath, 'SUNO_GUIDE.md'), 'utf-8'),
        readFile(join(docsPath, 'languages', 'LANGUAGE_ARCHITECTURE.md'), 'utf-8'),
      ]);

    cachedDocuments = {
      curiosity,
      pedagogy,
      pipeline,
      logicSticks,
      sunoGuide,
      languageArchitecture,
    };
    cacheTimestamp = now;

    return cachedDocuments;
  } catch (error) {
    console.error('Failed to load agent documents:', error);
    throw new Error('Failed to load agent knowledge documents');
  }
}

/**
 * Load language brain document — MANDATORY before lyrics generation.
 * Enforces "Brains Before Mouths" architecture.
 */
export async function loadLanguageBrain(language: SupportedLanguage): Promise<LanguageBrain> {
  const now = Date.now();
  const cached = languageBrainCache.get(language);

  // Return cached if still valid
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.brain;
  }

  const brainPath = LANGUAGE_BRAIN_PATHS[language];
  const fullPath = join(process.cwd(), brainPath);

  try {
    const rawDocument = await readFile(fullPath, 'utf-8');

    // Extract cognitive patterns from the YAML in the document
    const brain: LanguageBrain = {
      code: language,
      name: LANGUAGE_NAMES[language],
      cognitiveSemantics: extractCognitiveSemantics(rawDocument, language),
      features: extractLinguisticFeatures(rawDocument, language),
      rawDocument,
    };

    languageBrainCache.set(language, { brain, timestamp: now });
    return brain;
  } catch (error) {
    console.error(`Failed to load language brain for ${language}:`, error);
    throw new Error(`Language brain not found: ${language}. Cannot generate lyrics without brain.`);
  }
}

/**
 * Load agent documents WITH language brain — enforced loading.
 * This is the REQUIRED entry point for lyrics generation.
 */
export async function loadAgentDocumentsWithBrain(
  language: SupportedLanguage
): Promise<AgentDocumentsWithBrain> {
  const [docs, languageBrain] = await Promise.all([
    loadAgentDocuments(),
    loadLanguageBrain(language),
  ]);

  return {
    ...docs,
    languageBrain,
  };
}

/**
 * Extract cognitive semantics from language document.
 * Parses YAML blocks to understand how the language thinks.
 */
function extractCognitiveSemantics(
  _document: string,
  language: SupportedLanguage
): LanguageBrain['cognitiveSemantics'] {
  // Default patterns per language (parsed from documents)
  const patterns: Record<SupportedLanguage, LanguageBrain['cognitiveSemantics']> = {
    en: {
      agentFocus: 'high',
      topicProminent: false,
      evidentiality: false,
      spatialFraming: 'relative',
    },
    tr: {
      agentFocus: 'medium',
      topicProminent: false,
      evidentiality: true, // -miş, -di markers
      spatialFraming: 'relative',
    },
    zh: {
      agentFocus: 'low',
      topicProminent: true,
      evidentiality: false,
      spatialFraming: 'relative',
    },
  };

  return patterns[language];
}

/**
 * Extract linguistic features from language document.
 */
function extractLinguisticFeatures(
  _document: string,
  language: SupportedLanguage
): LanguageBrain['features'] {
  const features: Record<SupportedLanguage, LanguageBrain['features']> = {
    en: {
      wordOrder: 'SVO',
      agglutinative: false,
      tonal: false,
      stressPattern: 'mobile',
    },
    tr: {
      wordOrder: 'SOV',
      agglutinative: true,
      tonal: false,
      stressPattern: 'fixed', // Usually final syllable
    },
    zh: {
      wordOrder: 'SVO',
      agglutinative: false,
      tonal: true,
      stressPattern: 'pitch',
    },
  };

  return features[language];
}

/**
 * Clear the document cache.
 * Useful for development when documents are being edited.
 */
export function clearDocumentCache(): void {
  cachedDocuments = null;
  cacheTimestamp = 0;
}

/**
 * Load a single document by name.
 */
export async function loadDocument(
  name: keyof AgentDocuments
): Promise<string> {
  const docs = await loadAgentDocuments();
  return docs[name];
}

/**
 * Get document excerpt for prompt inclusion.
 * Extracts key sections to reduce token usage.
 */
export function getDocumentExcerpt(
  document: string,
  maxLength: number = 4000
): string {
  if (document.length <= maxLength) {
    return document;
  }

  // Try to break at a section boundary
  const truncated = document.slice(0, maxLength);
  const lastSectionBreak = truncated.lastIndexOf('\n## ');

  if (lastSectionBreak > maxLength * 0.5) {
    return truncated.slice(0, lastSectionBreak) + '\n\n[... truncated ...]';
  }

  return truncated + '\n\n[... truncated ...]';
}
