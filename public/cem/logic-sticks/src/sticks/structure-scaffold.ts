/**
 * Structure Scaffold Stick
 *
 * Applies consistent structure based on learning technique.
 * Vector: [organization, consistency, flow]
 */

import type { LogicStick, Technique, StructureScaffold } from '../types.js';

export interface StructureScaffoldInput {
  technique: Technique;
}

export interface StructureScaffoldOutput extends StructureScaffold {}

/**
 * Structure Scaffold Logic Stick
 *
 * GIVEN technique: "memorization" | "connection"
 * RETURN structure blueprint for song generation
 */
export const structureScaffold: LogicStick<StructureScaffoldInput, StructureScaffoldOutput> = {
  name: 'structure_scaffold',
  purpose: 'Apply consistent structure based on technique',
  vector: ['organization', 'consistency', 'flow'] as const,
  consumers: ['@humanitic/kidlearnio'] as const,

  apply: (input: StructureScaffoldInput): StructureScaffoldOutput => {
    const { technique } = input;

    if (technique === 'memorization') {
      return {
        sections: [
          'hook',
          'verse1',
          'chorus',
          'verse2',
          'chorus',
          'bridge',
          'chorus',
        ] as const,
        chorusRepeats: 3,
        verseComplexity: 'low',
        chorusPurpose: 'the fact to remember',
        bridgePurpose: 'playful reinforcement',
      };
    }

    // Connection technique
    return {
      sections: [
        'anchor',
        'bridge',
        'chorus',
        'expansion',
        'application',
        'final_chorus',
      ] as const,
      chorusRepeats: 2,
      verseComplexity: 'building',
      chorusPurpose: 'core concept',
      bridgePurpose: 'real world connection',
    };
  },

  composition: {
    composesWith: [
      'age_adapter',
      'curiosity_spark',
      'memorability_booster',
      'connection_bridge',
    ],
  },
};
