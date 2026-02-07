import { readFile } from 'fs/promises';
import { join } from 'path';
import type { AgentDocuments } from '@/types';

// Cache for loaded documents
let cachedDocuments: AgentDocuments | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

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
    const [curiosity, pedagogy, pipeline, logicSticks, sunoGuide] =
      await Promise.all([
        readFile(join(docsPath, 'CURIOSITY_TECHNIQUES.md'), 'utf-8'),
        readFile(join(docsPath, 'PEDAGOGICAL_APPROACH.md'), 'utf-8'),
        readFile(join(docsPath, 'THOUGHT_PIPELINE.md'), 'utf-8'),
        readFile(join(docsPath, 'LOGIC_STICKS.md'), 'utf-8'),
        readFile(join(docsPath, 'SUNO_GUIDE.md'), 'utf-8'),
      ]);

    cachedDocuments = {
      curiosity,
      pedagogy,
      pipeline,
      logicSticks,
      sunoGuide,
    };
    cacheTimestamp = now;

    return cachedDocuments;
  } catch (error) {
    console.error('Failed to load agent documents:', error);
    throw new Error('Failed to load agent knowledge documents');
  }
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
