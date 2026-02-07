/**
 * Document Paths
 *
 * Exports paths to documentation files for agent consumption.
 * Consumers can read these documents to understand stick behavior.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the package root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, '..');

/**
 * Path to the docs directory
 */
export const DOCS_PATH = join(packageRoot, 'docs');

/**
 * Individual document paths
 */
export const DOCUMENT_PATHS = {
  /** Full catalog of all sticks */
  STICK_CATALOG: join(DOCS_PATH, 'STICK_CATALOG.md'),

  /** Vector space model explanation */
  VECTOR_MODEL: join(DOCS_PATH, 'VECTOR_MODEL.md'),
} as const;

/**
 * Get the path to a specific document
 */
export function getDocumentPath(
  docName: keyof typeof DOCUMENT_PATHS
): string {
  return DOCUMENT_PATHS[docName];
}

/**
 * Get all document paths as an array
 */
export function getAllDocumentPaths(): string[] {
  return Object.values(DOCUMENT_PATHS);
}
