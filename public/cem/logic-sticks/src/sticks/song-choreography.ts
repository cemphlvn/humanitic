/**
 * Song Choreography Stick
 *
 * Provides movement patterns that anchor memory through kinesthetic learning.
 * Rules defined in docs/SONG_CHOREOGRAPHY.md (editable by dance/PE teachers).
 * Vector: [kinesthetic, rhythm, retention]
 */

import type { LogicStick, AgeRange, Technique } from '../types.js';

export interface SongChoreographyInput {
  ageRange: AgeRange;
  technique: Technique;
}

export interface SongChoreographyOutput {
  // Available movements for this age
  availableMovements: Movement[];

  // Density rules
  movementsPerChorus: [number, number]; // [min, max]
  movementsPerVerse: [number, number];

  // Placement rules
  placementRules: string[];

  // Guidance for prompt
  choreographyGuidance: string;
}

export interface Movement {
  marker: string;      // e.g., "[clap]"
  description: string; // e.g., "Single hand clap"
  useFor: string;      // e.g., "Emphasis, beat marker"
}

/**
 * Song Choreography Logic Stick
 *
 * GIVEN age_range and technique
 * RETURN movement vocabulary and placement rules
 */
export const songChoreography: LogicStick<SongChoreographyInput, SongChoreographyOutput> = {
  name: 'song_choreography',
  purpose: 'Provide age-appropriate movement patterns for kinesthetic learning',
  vector: ['kinesthetic', 'rhythm', 'retention'] as const,
  consumers: ['@humanitic/kidlearnio'] as const,

  apply: (input: SongChoreographyInput): SongChoreographyOutput => {
    const [minAge] = input.ageRange;
    const { technique } = input;

    const availableMovements = getMovementsForAge(minAge);
    const density = getMovementDensity(technique);
    const placementRules = getPlacementRules();

    return {
      availableMovements,
      ...density,
      placementRules,
      choreographyGuidance: buildChoreographyGuidance(availableMovements, density, minAge),
    };
  },

  composition: {
    composesWith: ['song_order', 'age_adapter'],
    composedBy: ['language_router'],
  },
};

// Core movement vocabulary (from SONG_CHOREOGRAPHY.md)
const ALL_MOVEMENTS: Movement[] = [
  { marker: '[clap]', description: 'Single hand clap', useFor: 'Emphasis, beat marker' },
  { marker: '[clap clap]', description: 'Double clap', useFor: 'End of phrase' },
  { marker: '[stomp]', description: 'Foot stomp', useFor: 'Strong emphasis' },
  { marker: '[snap]', description: 'Finger snap', useFor: 'Lighter emphasis' },
  { marker: '[wave]', description: 'Hand wave motion', useFor: 'Flow, water, air' },
  { marker: '[point up]', description: 'Point to sky', useFor: 'Sky, up, high concepts' },
  { marker: '[point down]', description: 'Point to ground', useFor: 'Earth, down, low concepts' },
  { marker: '[spin]', description: 'Quarter turn', useFor: 'Change, transformation' },
  { marker: '[freeze]', description: 'Stop all movement', useFor: 'Surprise, attention' },
  { marker: '[march]', description: 'March in place', useFor: 'Sequence, counting' },
];

function getMovementsForAge(minAge: number): Movement[] {
  if (minAge <= 7) {
    // Gross motor only, no fine motor (snapping hard for small hands)
    return ALL_MOVEMENTS.filter(m =>
      ['[clap]', '[clap clap]', '[stomp]', '[spin]', '[freeze]', '[march]'].includes(m.marker)
    );
  }
  if (minAge <= 10) {
    // Add snap, wave, point
    return ALL_MOVEMENTS.filter(m =>
      !['[spin]'].includes(m.marker) || minAge >= 9
    );
  }
  // Ages 11-14: full vocabulary
  return ALL_MOVEMENTS;
}

function getMovementDensity(technique: Technique): Pick<SongChoreographyOutput, 'movementsPerChorus' | 'movementsPerVerse'> {
  if (technique === 'memorization') {
    return {
      movementsPerChorus: [4, 6],
      movementsPerVerse: [1, 2],
    };
  }
  // Connection: less movement, more focus on understanding
  return {
    movementsPerChorus: [2, 4],
    movementsPerVerse: [0, 1],
  };
}

function getPlacementRules(): string[] {
  return [
    'Movements on strong beats only, not between words',
    'Chorus gets most movement (memory anchor)',
    'Same movement = same concept (consistency)',
    'End of line preferred over mid-line',
    'Rest moments matter — not every line needs movement',
  ];
}

function buildChoreographyGuidance(
  movements: Movement[],
  density: Pick<SongChoreographyOutput, 'movementsPerChorus' | 'movementsPerVerse'>,
  minAge: number
): string {
  const movementList = movements.map(m => `${m.marker} — ${m.useFor}`).join('\n');
  const maxDifferent = minAge <= 7 ? 2 : minAge <= 10 ? 4 : 6;

  return `
CHOREOGRAPHY (from song_choreography stick):

AVAILABLE MOVEMENTS:
${movementList}

DENSITY RULES:
- Chorus: ${density.movementsPerChorus[0]}-${density.movementsPerChorus[1]} movements
- Verse: ${density.movementsPerVerse[0]}-${density.movementsPerVerse[1]} movements
- Max ${maxDifferent} different movement types per song

PLACEMENT:
- Place at END of lines, on the beat
- Chorus gets most movement
- Same movement = same concept
`.trim();
}
