# Logic Sticks Catalog

> **Atomic reasoning patterns for agent composition**
> Each stick is a vector in conceptual space

---

## Foundation Sticks

### 1. Age Adapter

```yaml
name: age_adapter
purpose: Adjust any content for target age range
vector: [development, accessibility, appropriateness]
consumers: [kidlearnio]

logic: |
  GIVEN age_range [min, max]

  IF min <= 7:
    vocabulary_level: "concrete_only"
    sentence_max: 7
    metaphor_source: ["animals", "toys", "family", "food"]
    complexity: "single_step"

  ELIF min <= 10:
    vocabulary_level: "introduce_technical"
    sentence_max: 10
    metaphor_source: ["sports", "games", "nature", "technology"]
    complexity: "multi_step"

  ELSE:
    vocabulary_level: "technical_with_context"
    sentence_max: 15
    metaphor_source: ["social", "culture", "systems", "abstract"]
    complexity: "abstract_ok"

  RETURN adjusted_parameters

composition:
  composes_with: [vocabulary_gate, connection_bridge]
  composed_by: [structure_scaffold]
```

### 2. Curiosity Spark

```yaml
name: curiosity_spark
purpose: Transform any statement into a curiosity trigger
vector: [engagement, wonder, question]
consumers: [kidlearnio]

logic: |
  GIVEN fact: string

  patterns:
    wonder: "I wonder {question_form(fact)}..."
    challenge: "Did you know {surprising_reframe(fact)}?"
    mystery: "There's a secret about {topic(fact)}..."
    impossible: "How do you think {make_improbable(fact)}?"

  SELECT pattern based on:
    - Age range (younger = wonder/mystery)
    - Topic type (scientific = challenge)
    - Desired engagement level

  RETURN curiosity_trigger

composition:
  composes_with: [age_adapter]
  composed_by: [structure_scaffold]
```

### 3. Memorability Booster

```yaml
name: memorability_booster
purpose: Make any phrase more memorable
vector: [retention, rhythm, recall]
consumers: [kidlearnio]

logic: |
  GIVEN phrase: string

  techniques:
    rhyme: Add rhyming word at end
    rhythm: Adjust syllables to 4-beat pattern
    alliteration: Start key words with same letter
    repetition: Echo key word 2x
    contrast: Add opposing concept

  APPLY techniques in order until phrase scores > 0.7 memorability

  RETURN boosted_phrase

composition:
  composes_with: [rhyme_finder]
  composed_by: [structure_scaffold]
```

### 4. Connection Bridge

```yaml
name: connection_bridge
purpose: Create bridge from known concept to unknown
vector: [analogy, scaffolding, transfer]
consumers: [kidlearnio]

logic: |
  GIVEN:
    known: familiar_concept
    unknown: target_concept
    age_range: [min, max]

  FIND shared_attribute between known and unknown

  pattern: "{known} is like {unknown} because {shared_attribute}"

  VALIDATE:
    - Shared attribute is obvious to age range
    - Comparison doesn't mislead
    - Bridge is one step (not chained)

  RETURN bridge_statement

composition:
  composes_with: [age_adapter]
  composed_by: [structure_scaffold]
```

### 5. Structure Scaffold

```yaml
name: structure_scaffold
purpose: Apply consistent structure based on technique
vector: [organization, consistency, flow]
consumers: [kidlearnio]

logic: |
  GIVEN technique: "memorization" | "connection"

  IF technique == "memorization":
    RETURN {
      sections: ["hook", "verse1", "chorus", "verse2", "chorus", "bridge", "chorus"],
      chorus_repeats: 3,
      verse_complexity: "low",
      chorus_purpose: "the fact to remember",
      bridge_purpose: "playful reinforcement"
    }

  IF technique == "connection":
    RETURN {
      sections: ["anchor", "bridge", "chorus", "expansion", "application", "final_chorus"],
      chorus_repeats: 2,
      verse_complexity: "building",
      chorus_purpose: "core concept",
      bridge_purpose: "real world connection"
    }

composition:
  composes: [age_adapter, curiosity_spark, memorability_booster, connection_bridge]
```

### 6. Vocabulary Gate

```yaml
name: vocabulary_gate
purpose: Check and replace words above age level
vector: [accessibility, clarity, simplification]
consumers: [kidlearnio]

logic: |
  GIVEN:
    text: string
    age_range: [min, max]

  word_lists:
    age_5_7: [500 most common words]
    age_8_10: [1500 common words + selected science terms]
    age_11_14: [3000 words + domain vocabulary]

  FOR each word in text:
    IF word NOT IN appropriate_list:
      IF technical_term AND has_bridge:
        KEEP with bridge phrase
      ELSE:
        REPLACE with simpler synonym

  RETURN gated_text

composition:
  composes_with: [age_adapter, connection_bridge]
```

### 7. Rhyme Finder

```yaml
name: rhyme_finder
purpose: Find age-appropriate rhymes for any word
vector: [phonetics, vocabulary, melody]
consumers: [kidlearnio]

logic: |
  GIVEN:
    word: string
    age_range: [min, max]
    rhyme_type: "perfect" | "near" | "internal"

  SEARCH rhyme database filtered by:
    - Age-appropriate vocabulary
    - Positive/neutral connotation
    - Common usage

  RANK by:
    1. Relevance to educational context
    2. Memorability
    3. Simplicity

  RETURN top_5_rhymes

composition:
  composes_with: [vocabulary_gate, memorability_booster]
```

### 8. Language Router

```yaml
name: language_router
purpose: Route concept through correct language brain BEFORE generation
vector: [cognition, localization, native_voice]
consumers: [kidlearnio]

logic: |
  GIVEN:
    concept: ExtractedConcept
    target_language: 'en' | 'tr' | 'zh' | ...

  ENFORCE (MANDATORY SEQUENCE):
    1. MUST load language brain document FIRST
    2. MUST NOT generate in English then translate
    3. MUST apply language-specific cognitive patterns
    4. MUST use native word arts (idioms, proverbs, wordplay)
    5. MUST validate against native speaker patterns

  LOAD:
    brain_document: docs/languages/LYRICS_{LANG}.md

  APPLY_IN_ORDER:
    1. cognitive_semantics
    2. grammatical_features
    3. morphological_rules
    4. phonetic_patterns
    5. word_arts
    6. rhyme_meter

  RETURN lyrics_in_native_voice

composition:
  precedes: ALL other sticks (mandatory first position)
  domain: Language-specific content generation
```

---

## Domain Sticks (Suno-Specific)

### 9. Suno Style Composer

```yaml
name: suno_style_composer
purpose: Build valid Suno style prompt from components
vector: [style, musicality, age_appropriate]
consumers: [kidlearnio]

logic: |
  GIVEN:
    technique: "memorization" | "connection"
    age_range: [min, max]
    mood: string

  components:
    genre:
      memorization: ["children's pop", "nursery", "playground chant"]
      connection: ["educational pop", "story-song", "folk-inspired"]

    tempo:
      ages_5_7: "90-110 BPM, easy to follow"
      ages_8_10: "100-120 BPM, energetic"
      ages_11_14: "100-130 BPM, dynamic"

  COMPOSE: "[genre], [mood], [tempo], [instruments], [vocals]"
  VALIDATE: 4-7 descriptors

  RETURN style_prompt

composition:
  composes_with: [age_adapter]
  domain: Suno AI music generation
```

---

## Composition Rules

```yaml
ordering:
  0. language_router       # MUST BE FIRST — load language brain
  1. age_adapter           # Determine constraints
  2. curiosity_spark       # Create opening hook
  3. structure_scaffold    # Get section blueprint
  4. connection_bridge     # If technique is connection
  5. memorability_booster  # Enhance key phrases
  6. vocabulary_gate       # Final vocabulary check
  7. rhyme_finder          # Polish rhyme scheme

conflicts:
  resolution_priority:
    1. Safety (never compromise age-appropriateness)
    2. Educational accuracy
    3. Memorability
    4. Style preferences
```

---

## Adding New Sticks

```yaml
process:
  1. Identify gap in reasoning capability
  2. Define vector (conceptual direction)
  3. Specify logic (GIVEN → PROCESS → RETURN)
  4. Declare composition relationships
  5. Add to catalog
  6. Consumer tests and refines

contribution:
  - Fork/PR to humanitic/public/cem/logic-sticks
  - Or: File issue describing needed stick
  - Or: Consumer instance evolves stick through use
```

---

## Version

```yaml
version: 1.0.0
type: shared-substrate
purpose: Atomic reasoning patterns for agent composition
status: Co-building with kidlearnio
```
