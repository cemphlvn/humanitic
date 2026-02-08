/**
 * Turkish Syllable Counter (Hece Ölçüsü)
 *
 * Deterministic syllable counting for Turkish lyrics validation.
 * Turkish syllables = vowel count, with ulama (liaison) adjustments.
 */

const TURKISH_VOWELS = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü', 'A', 'E', 'I', 'İ', 'O', 'Ö', 'U', 'Ü']);

/**
 * Count syllables in a Turkish word.
 * Each vowel = 1 syllable.
 */
export function countWordSyllables(word: string): number {
  let count = 0;
  for (const char of word) {
    if (TURKISH_VOWELS.has(char)) {
      count++;
    }
  }
  return count;
}

/**
 * Count syllables in a Turkish line, applying ulama (liaison).
 * Ulama: When word ends with vowel and next starts with vowel, they merge.
 * Example: "gel artık" = "ge-lar-tık" (3 syllables, not 4)
 */
export function countLineSyllables(line: string): number {
  // Remove markers like [Verse], [Nakarat], punctuation
  const cleanLine = line
    .replace(/\[.*?\]/g, '')
    .replace(/[.,!?;:'"()-]/g, '')
    .trim();

  if (!cleanLine) return 0;

  const words = cleanLine.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;

  let totalSyllables = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word) continue;

    const wordSyllables = countWordSyllables(word);
    totalSyllables += wordSyllables;

    // Apply ulama: if this word ends with vowel and next starts with vowel
    const nextWord = words[i + 1];
    if (nextWord) {
      const lastChar = word[word.length - 1];
      const nextFirstChar = nextWord[0];
      if (lastChar && nextFirstChar && TURKISH_VOWELS.has(lastChar) && TURKISH_VOWELS.has(nextFirstChar)) {
        totalSyllables--; // Ulama merges these into one syllable
      }
    }
  }

  return totalSyllables;
}

/**
 * Analyze syllable consistency in Turkish lyrics.
 * Returns the dominant syllable count and any inconsistent lines.
 */
export interface SyllableAnalysis {
  dominantCount: number;
  lines: Array<{
    text: string;
    syllables: number;
    isConsistent: boolean;
  }>;
  inconsistentLines: number;
  totalLines: number;
  consistencyScore: number; // 0-1
}

export function analyzeLyricsSyllables(lyrics: string): SyllableAnalysis {
  const lines = lyrics
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('['));

  if (lines.length === 0) {
    return {
      dominantCount: 0,
      lines: [],
      inconsistentLines: 0,
      totalLines: 0,
      consistencyScore: 1,
    };
  }

  // Count syllables for each line
  const lineCounts = lines.map(line => ({
    text: line,
    syllables: countLineSyllables(line),
    isConsistent: true, // Will be updated
  }));

  // Find dominant syllable count (mode)
  const countFrequency = new Map<number, number>();
  for (const { syllables } of lineCounts) {
    if (syllables > 0) {
      countFrequency.set(syllables, (countFrequency.get(syllables) || 0) + 1);
    }
  }

  let dominantCount = 0;
  let maxFrequency = 0;
  for (const [count, freq] of countFrequency) {
    if (freq > maxFrequency) {
      maxFrequency = freq;
      dominantCount = count;
    }
  }

  // Allow ±1 syllable tolerance for natural variation
  const tolerance = 1;
  let inconsistentLines = 0;
  for (const lineInfo of lineCounts) {
    if (lineInfo.syllables === 0) {
      lineInfo.isConsistent = true; // Empty/marker lines are OK
    } else if (Math.abs(lineInfo.syllables - dominantCount) > tolerance) {
      lineInfo.isConsistent = false;
      inconsistentLines++;
    }
  }

  const validLines = lineCounts.filter(l => l.syllables > 0).length;
  const consistencyScore = validLines > 0
    ? (validLines - inconsistentLines) / validLines
    : 1;

  return {
    dominantCount,
    lines: lineCounts,
    inconsistentLines,
    totalLines: validLines,
    consistencyScore,
  };
}

/**
 * Format syllable analysis as feedback for lyrics refinement.
 */
export function formatSyllableFeedback(analysis: SyllableAnalysis): string {
  if (analysis.consistencyScore >= 0.9) {
    return `✓ Hece ölçüsü tutarlı (${analysis.dominantCount}'li)`;
  }

  const problems = analysis.lines
    .filter(l => !l.isConsistent && l.syllables > 0)
    .slice(0, 3) // Show max 3 examples
    .map(l => `  - "${l.text}" (${l.syllables} hece, beklenen: ${analysis.dominantCount})`)
    .join('\n');

  return `⚠️ Hece ölçüsü tutarsız (${analysis.dominantCount}'li bekleniyor):
${problems}
Tutarlılık: ${Math.round(analysis.consistencyScore * 100)}%`;
}
