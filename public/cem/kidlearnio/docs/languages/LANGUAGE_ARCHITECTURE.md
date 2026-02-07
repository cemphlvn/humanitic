# Language Architecture — Brains Before Mouths

> **"Düşünce dilden önce gelir"** — Thought precedes language
> Logic-based lyric generation, not literal translation

---

## Core Principle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      BRAINS BEFORE MOUTHS                                │
│                                                                          │
│   CONCEPT (universal)                                                    │
│       ↓                                                                  │
│   LOGIC LAYER (language-agnostic meaning)                                │
│       ↓                                                                  │
│   LANGUAGE BRAIN (cognitive semantics of target language)                │
│       ↓                                                                  │
│   LINGUISTIC FEATURES (grammar, morphology, phonetics)                   │
│       ↓                                                                  │
│   WORD ARTS (idioms, proverbs, wordplay)                                 │
│       ↓                                                                  │
│   OUTPUT (lyrics in target language)                                     │
│                                                                          │
│   NEVER: Concept → English → Translate                                   │
│   ALWAYS: Concept → Logic → Native Language Brain                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Anti-Pattern (What We Avoid)

```yaml
wrong_approach:
  name: "Translation Mode"
  process:
    1. Generate lyrics in English
    2. Translate to target language
  problems:
    - Loses native rhythm and meter
    - Idioms become nonsense
    - Wordplay impossible
    - Cultural resonance absent
    - Grammatical awkwardness
    - "Foreign" feel to native speakers

example:
  english: "It's raining cats and dogs"
  literal_turkish: "Kediler ve köpekler yağıyor" # Nonsense
  native_turkish: "Bardaktan boşanırcasına yağıyor" # Native idiom
```

---

## The Correct Pattern

```yaml
correct_approach:
  name: "Native Brain Mode"
  process:
    1. Extract CONCEPT (what to teach)
    2. Process through LOGIC LAYER (meaning structure)
    3. Activate TARGET LANGUAGE BRAIN
    4. Apply language-specific features
    5. Generate in native voice

pipeline:
  CONCEPT_EXTRACTION:
    - Core educational content
    - Key facts to memorize
    - Connections to build
    - Curiosity triggers

  LOGIC_LAYER:
    - Semantic roles (agent, patient, instrument)
    - Causal relationships
    - Temporal sequences
    - Spatial relationships
    - Quantitative relationships

  LANGUAGE_BRAIN:
    - Cognitive patterns of the language
    - How speakers of this language THINK
    - Cultural mental models
    - Native categorization systems

  LINGUISTIC_FEATURES:
    - Grammatical structures
    - Morphological patterns
    - Phonetic constraints
    - Prosodic features (stress, tone)

  WORD_ARTS:
    - Native idioms (deyimler)
    - Proverbs (atasözleri)
    - Wordplay (söz oyunları)
    - Poetic devices (söz sanatları)
    - Rhyme patterns native to language
```

---

## Enforcement Architecture

### 1. Language Brain Loader

```typescript
interface LanguageBrain {
  code: string;                    // 'tr', 'en', 'zh'
  name: string;                    // 'Turkish', 'English', 'Chinese'

  // Cognitive patterns
  cognitiveSemantics: {
    agentivity: 'high' | 'medium' | 'low';
    evidentiality: boolean;        // Does language mark information source?
    aspectual: 'perfective' | 'imperfective' | 'both';
    spatialFraming: 'absolute' | 'relative' | 'intrinsic';
  };

  // Linguistic features
  features: {
    wordOrder: 'SOV' | 'SVO' | 'VSO' | 'flexible';
    agglutinative: boolean;
    tonal: boolean;
    stressPattern: 'fixed' | 'mobile' | 'pitch';
    syllableStructure: string;     // e.g., '(C)V(C)'
  };

  // Poetic resources
  wordArts: {
    rhymeTypes: string[];
    meterPatterns: string[];
    commonDevices: string[];
  };

  // Document path
  guideDocument: string;           // Path to LYRICS_{LANG}.md
}
```

### 2. Pipeline Enforcement

```typescript
// ENFORCED: Language brain must load BEFORE generation
async function generateLyricsEnforced(
  concept: ExtractedConcept,
  targetLanguage: string
): Promise<string> {

  // 1. BRAIN LOADING (enforced first step)
  const brain = await loadLanguageBrain(targetLanguage);
  const guide = await loadDocument(brain.guideDocument);

  // 2. LOGIC LAYER (language-agnostic)
  const logicStructure = extractLogicStructure(concept);

  // 3. LANGUAGE-SPECIFIC GENERATION
  // Agent prompt now includes language brain
  const lyrics = await generateWithBrain(logicStructure, brain, guide);

  // 4. VALIDATION (native speaker patterns)
  const validation = validateNativePatterns(lyrics, brain);

  if (!validation.passesNativeCheck) {
    // Regenerate with feedback
    return regenerateWithFeedback(lyrics, validation.issues, brain);
  }

  return lyrics;
}
```

### 3. Logic Stick: Language Router

```yaml
name: language_router
purpose: Route concept through correct language brain

logic: |
  GIVEN:
    concept: ExtractedConcept
    target_language: 'tr' | 'en' | 'zh' | ...

  ENFORCE:
    - MUST load language brain document
    - MUST NOT generate in English first
    - MUST apply language-specific word arts
    - MUST validate against native patterns

  LOAD:
    brain_document: docs/languages/LYRICS_{LANG}.md

  APPLY_IN_ORDER:
    1. cognitive_semantics  # How this language thinks
    2. grammatical_features # Structure constraints
    3. morphological_rules  # Word formation
    4. phonetic_patterns    # Sound constraints
    5. word_arts            # Idioms, proverbs, wordplay
    6. rhyme_meter          # Native poetic patterns

  VALIDATE:
    - Native idiom usage (not translated idioms)
    - Grammatical naturalness
    - Phonetic flow
    - Cultural appropriateness

  OUTPUT:
    lyrics: string (in target language, native voice)
```

---

## Supported Languages

| Code | Language | Brain Document | Status |
|------|----------|----------------|--------|
| `en` | English | `LYRICS_EN.md` | Active |
| `tr` | Turkish | `LYRICS_TR.md` | Active |
| `zh` | Chinese | `LYRICS_ZH.md` | Active |

---

## Adding New Languages

```yaml
to_add_language:
  1. Create LYRICS_{LANG}.md with:
     - Cognitive semantics section
     - Grammatical features
     - Morphological patterns
     - Phonetic/prosodic features
     - Word arts inventory
     - Rhyme and meter patterns
     - Example lyrics in native voice

  2. Register in LANGUAGE_ARCHITECTURE.md

  3. Test with native speaker validation
```

---

## Version

```yaml
version: 1.0.0
type: architectural-document
purpose: Enforce native language generation over translation
principle: "Brains before mouths"
```
