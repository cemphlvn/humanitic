# Logic Sticks — Agent Knowledge Document

> **Reusable reasoning patterns for consistent agent behavior**
> "Sticks" that hold logic together across sessions

---

## What Are Logic Sticks?

```yaml
definition: |
  Atomic units of reasoning that can be composed into larger behaviors.
  Named "sticks" because they:
  - Can be picked up and used anywhere
  - Connect pieces together
  - Are simple but strong
  - Build structures when combined

purpose:
  - Ensure consistent reasoning across agents
  - Enable behavior modification without code changes
  - Create composable intelligence patterns
```

---

## Core Logic Sticks

### 1. Age Adapter Stick

```yaml
name: age_adapter
purpose: Adjust any content for target age range

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

usage:
  - Every agent applies this before generating content
  - Ensures age-appropriate output across system
```

### 2. Curiosity Spark Stick

```yaml
name: curiosity_spark
purpose: Transform any statement into a curiosity trigger

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

example:
  input: "Water evaporates when heated"
  output: "I wonder where puddles disappear to on sunny days..."
```

### 3. Memorability Booster Stick

```yaml
name: memorability_booster
purpose: Make any phrase more memorable

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

example:
  input: "Plants use sunlight to make food"
  techniques_applied: [rhythm, rhyme]
  output: "Plants use the light of the sun / To make their food, every one!"
```

### 4. Connection Bridge Stick

```yaml
name: connection_bridge
purpose: Create bridge from known concept to unknown

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

example:
  known: "heart"
  unknown: "pump"
  shared: "pushes liquid"
  output: "Your heart is like a pump because it pushes blood around!"
```

### 5. Structure Scaffold Stick

```yaml
name: structure_scaffold
purpose: Apply consistent song structure based on technique

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

usage:
  - Lyrics Agent applies this to ensure correct structure
```

### 6. Vocabulary Gate Stick

```yaml
name: vocabulary_gate
purpose: Check and replace words above age level

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

example:
  input: "Photosynthesis converts carbon dioxide"
  age: 8
  output: "Photo-SIN-thesis (making food with light) changes the air we breathe out"
```

### 7. Rhyme Finder Stick

```yaml
name: rhyme_finder
purpose: Find age-appropriate rhymes for any word

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

example:
  word: "sun"
  age: 7
  output: ["fun", "run", "one", "done", "begun"]
```

### 8. Suno Style Composer Stick

```yaml
name: suno_style_composer
purpose: Build valid Suno style prompt from components

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

    vocals:
      all: "clear enunciation, child-friendly range"
      add_for_memorization: "sing-along, call and response"
      add_for_connection: "expressive, narrative quality"

    instruments:
      ages_5_7: "acoustic guitar, ukulele, piano, claps"
      ages_8_10: "piano, guitar, light drums, bells"
      ages_11_14: "full band, synths, varied percussion"

  COMPOSE: "[genre], [mood], [tempo], [instruments], [vocals]"

  VALIDATE: 4-7 descriptors

  RETURN style_prompt
```

---

## Composition Rules

### Stick Ordering

```yaml
when_generating_lyrics:
  1. age_adapter           # Determine constraints
  2. curiosity_spark       # Create opening hook
  3. structure_scaffold    # Get section blueprint
  4. connection_bridge     # If technique is connection
  5. memorability_booster  # Enhance key phrases
  6. vocabulary_gate       # Final vocabulary check
  7. rhyme_finder          # Polish rhyme scheme

when_generating_style:
  1. age_adapter           # Determine constraints
  2. suno_style_composer   # Build prompt
```

### Stick Conflicts

```yaml
resolution_priority:
  1. Safety (never compromise on age-appropriateness)
  2. Educational accuracy
  3. Memorability
  4. Style preferences

example_conflict:
  situation: rhyme_finder suggests word outside vocabulary_gate
  resolution: vocabulary_gate wins, find different rhyme
```

---

## Adding New Sticks

```yaml
template:
  name: unique_identifier
  purpose: single_sentence_description
  logic: |
    GIVEN inputs
    PROCESS with clear steps
    RETURN outputs
  example:
    input: ...
    output: ...
  integration_point: where_in_pipeline_this_applies
```

---

## Version

```yaml
version: 1.0.0
type: agent-knowledge-document
purpose: Define reusable reasoning patterns for agent consistency
```
