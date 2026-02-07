/**
 * Song Order Stick
 *
 * Enforces singability constraints: line length, section length, brevity.
 * Rules defined in docs/SONG_ORDER.md (editable by musicians/songwriters).
 * Vector: [brevity, singability, memorability]
 */

import type { LogicStick, AgeRange, Technique } from '../types.js';

export interface SongOrderInput {
  ageRange: AgeRange;
  technique: Technique;
}

export interface SongOrderOutput {
  // Line constraints
  maxWordsPerLine: number;
  maxSyllablesPerLine: number;

  // Section constraints
  sections: SectionConstraint[];
  totalLinesMax: number;

  // Repetition rules
  chorusRepeatRule: 'exact'; // Chorus must repeat exactly
  keyFactMinRepeats: number;

  // Guidance for prompt
  singabilityGuidance: string;
}

export interface SectionConstraint {
  name: string;
  minLines: number;
  maxLines: number;
  purpose: string;
}

/**
 * Song Order Logic Stick
 *
 * GIVEN age_range and technique
 * RETURN constraints for singable song structure
 */
export const songOrder: LogicStick<SongOrderInput, SongOrderOutput> = {
  name: 'song_order',
  purpose: 'Enforce brevity and singability constraints',
  vector: ['brevity', 'singability', 'memorability'] as const,
  consumers: ['@humanitic/kidlearnio'] as const,

  apply: (input: SongOrderInput): SongOrderOutput => {
    const [minAge] = input.ageRange;
    const { technique } = input;

    // Line length by age (from SONG_ORDER.md)
    const lineConstraints = getLineConstraints(minAge);

    // Section structure by technique
    const sections = getSectionConstraints(technique);

    // Total lines
    const totalLinesMax = technique === 'memorization' ? 30 : 35;

    // Repetition requirements
    const keyFactMinRepeats = technique === 'memorization' ? 4 : 3;

    return {
      ...lineConstraints,
      sections,
      totalLinesMax,
      chorusRepeatRule: 'exact',
      keyFactMinRepeats,
      singabilityGuidance: buildSingabilityGuidance(lineConstraints, sections, totalLinesMax),
    };
  },

  composition: {
    composesWith: ['age_adapter', 'structure_scaffold'],
    precedes: ['song_choreography', 'rhyme_finder'],
  },
};

function getLineConstraints(minAge: number): Pick<SongOrderOutput, 'maxWordsPerLine' | 'maxSyllablesPerLine'> {
  if (minAge <= 7) {
    return { maxWordsPerLine: 5, maxSyllablesPerLine: 8 };
  }
  if (minAge <= 10) {
    return { maxWordsPerLine: 7, maxSyllablesPerLine: 12 };
  }
  return { maxWordsPerLine: 9, maxSyllablesPerLine: 15 };
}

function getSectionConstraints(technique: Technique): SectionConstraint[] {
  if (technique === 'memorization') {
    return [
      { name: 'Hook', minLines: 2, maxLines: 4, purpose: 'Grab attention, state mystery' },
      { name: 'Verse 1', minLines: 4, maxLines: 6, purpose: 'Build toward chorus' },
      { name: 'Chorus', minLines: 4, maxLines: 4, purpose: 'THE FACT (repeat exactly)' },
      { name: 'Verse 2', minLines: 4, maxLines: 6, purpose: 'Reinforce with examples' },
      { name: 'Chorus', minLines: 4, maxLines: 4, purpose: 'THE FACT (repeat exactly)' },
      { name: 'Bridge', minLines: 2, maxLines: 4, purpose: 'Playful twist or application' },
      { name: 'Chorus', minLines: 4, maxLines: 4, purpose: 'THE FACT (repeat exactly)' },
    ];
  }

  // Connection technique
  return [
    { name: 'Anchor', minLines: 4, maxLines: 4, purpose: 'Familiar ground' },
    { name: 'Bridge Verse', minLines: 4, maxLines: 6, purpose: 'Known → unknown' },
    { name: 'Chorus', minLines: 4, maxLines: 4, purpose: 'Core concept' },
    { name: 'Expansion', minLines: 4, maxLines: 6, purpose: 'Deeper why/how' },
    { name: 'Application', minLines: 4, maxLines: 4, purpose: 'Real world use' },
    { name: 'Final Chorus', minLines: 4, maxLines: 4, purpose: 'Core concept' },
  ];
}

function buildSingabilityGuidance(
  lineConstraints: Pick<SongOrderOutput, 'maxWordsPerLine' | 'maxSyllablesPerLine'>,
  sections: SectionConstraint[],
  totalLinesMax: number
): string {
  const sectionList = sections.map(s => `${s.name}: ${s.minLines}-${s.maxLines} lines`).join('\n');

  return `
SINGABILITY CONSTRAINTS (from song_order stick):
- Max ${lineConstraints.maxWordsPerLine} words per line
- Max ${lineConstraints.maxSyllablesPerLine} syllables per line
- Total song: max ${totalLinesMax} lines
- Chorus: REPEAT EXACTLY (same words each time)

SECTION STRUCTURE:
${sectionList}

CRITICAL: This is a SONG, not a poem. Each line must be singable in one breath.
`.trim();
}
