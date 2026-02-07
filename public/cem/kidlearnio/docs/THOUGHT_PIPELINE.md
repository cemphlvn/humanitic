# Thought Pipeline — Agent Knowledge Document

> **The cognitive journey from topic to song**
> How agents reason through the generation process

---

## Pipeline Philosophy

```yaml
principle: "Think like a teacher who loves music and children"
voice: |
  I am the orchestrator.
  I continue remembering scriptically.
  Each step builds on the last.
  Forward, always forward.
```

---

## The 7-Step Thought Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1. RECEIVE → 2. UNDERSTAND → 3. REMEMBER → 4. DECIDE → 5. CREATE →    │
│  6. REFINE → 7. DELIVER                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step 1: RECEIVE (Input Processing)

```yaml
agent: Orchestrator
action: Parse and validate input

thought_process:
  - What topic has been requested?
  - What age range are we targeting?
  - What output type is needed (lyrics/style/both)?
  - Any special requirements mentioned?

validation:
  topic:
    - Is it educational?
    - Is it age-appropriate?
    - Is it specific enough to teach?
  age_range:
    - Valid range (5-18)?
    - Reasonable span (not 5-18)?

output:
  validated_input:
    topic: "photosynthesis"
    age_range: [8, 10]
    output_type: "both"
```

### Step 2: UNDERSTAND (Context Gathering)

```yaml
agent: Context Gatherer
action: Break down topic into teachable components

thought_process:
  - What are the CORE CONCEPTS within this topic?
  - What are the KEY FACTS that must be learned?
  - What REAL-WORLD CONNECTIONS exist?
  - What might CONFUSE children about this?
  - What makes this INTERESTING to kids?

example_for_photosynthesis:
  core_concepts:
    - Plants make their own food
    - They use sunlight as energy source
    - They take in carbon dioxide
    - They release oxygen
    - Water is essential

  key_facts:
    - "Photo" means light
    - "Synthesis" means making
    - Happens in leaves
    - Chlorophyll is green

  real_world_connections:
    - Why leaves are green
    - Why plants need sun
    - Why we need plants (oxygen)
    - Food chain beginning

  potential_confusions:
    - "Making food" vs eating food
    - Invisible gases
    - Energy as concept

  kid_interest_hooks:
    - Plants are like kitchen chefs!
    - Your lunch depends on this!
    - Superhero plants saving us

output:
  gathered_context: {...}
```

### Step 3: REMEMBER (Memory Consultation)

```yaml
agent: Memory Interface (Cognee)
action: Check for relevant past sessions

thought_process:
  - Have we generated songs about this topic before?
  - What techniques worked well for this age range?
  - Any patterns from high-rated generations?
  - Similar topics that succeeded?

query: "photosynthesis children song ages 8-10"

memory_integration:
  if past_success:
    - Extract working patterns
    - Note effective metaphors
    - Use validated style elements
  if no_memory:
    - Proceed with default approach
    - Flag for memory storage after

output:
  memory_context:
    past_patterns: [...]
    confidence: 0.7
```

### Step 4: DECIDE (Technique Selection)

```yaml
agent: Orchestrator
action: Choose approach based on context + age + memory

thought_process:
  - Is this topic better suited for MEMORIZATION or CONNECTION?
  - What curiosity technique fits best?
  - What pedagogical layer structure to use?

decision_matrix:
  memorization_signals:
    - Topic has discrete facts to encode
    - Names, dates, sequences, formulas
    - Young age range (5-7)
    - Short attention span expected

  connection_signals:
    - Topic requires understanding relationships
    - Systems, processes, causation
    - Older age range (11-14)
    - Builds on prior knowledge

example_decision:
  topic: photosynthesis
  age: 8-10
  decision: CONNECTION
  rationale: |
    - Process-based (how plants make food)
    - Requires understanding cause-effect
    - Age group can handle 6-layer structure
    - Core concept has clear anchor (food)

  curiosity_technique: "mystery_box"
  rationale: |
    - "How do plants eat without mouths?"
    - Creates cognitive tension
    - Resolved through song narrative

output:
  technique: "connection"
  curiosity_engine: "mystery_box"
  pedagogical_structure: "6-layer"
```

### Step 5: CREATE (Generation)

```yaml
agents: Lyrics Agent + Style Agent
action: Generate outputs based on decisions

lyrics_thought_process:
  - Apply selected curiosity technique
  - Follow pedagogical structure (6-layer for connection)
  - Use age-appropriate vocabulary
  - Create memorable chorus
  - Ensure educational accuracy
  - Make it singable (rhythm, rhyme)

style_thought_process:
  - Match style to technique (connection = exploratory)
  - Age-appropriate genre
  - Support the learning (clear vocals, moderate tempo)
  - 4-7 descriptors
  - Avoid conflicting elements

parallel_execution:
  lyrics_agent:
    input: context + technique + structure
    output: complete_lyrics

  style_agent:
    input: context + technique + age_range
    output: style_prompt

output:
  draft_lyrics: "..."
  draft_style: "..."
```

### Step 6: REFINE (Quality Check)

```yaml
agent: Orchestrator
action: Validate and improve outputs

thought_process:
  lyrics_check:
    - [ ] Educational accuracy maintained?
    - [ ] Age-appropriate vocabulary?
    - [ ] Follows selected structure?
    - [ ] Chorus is memorable?
    - [ ] Rhyme scheme consistent?
    - [ ] Singable rhythm?

  style_check:
    - [ ] 4-7 descriptors?
    - [ ] No conflicting elements?
    - [ ] Matches lyrics mood?
    - [ ] Age-appropriate genre?
    - [ ] Clear vocal instruction?

  coherence_check:
    - [ ] Style supports lyrics?
    - [ ] Together they achieve learning goal?
    - [ ] Would a kid enjoy this?

if_issues_found:
  - Identify specific problems
  - Request targeted regeneration
  - Maximum 2 refinement cycles

output:
  refined_lyrics: "..."
  refined_style: "..."
  quality_score: 0.85
```

### Step 7: DELIVER (Output + Memory)

```yaml
agent: Orchestrator
action: Format output and store to memory

thought_process:
  - Package outputs cleanly
  - Store successful generation to memory
  - Prepare for potential feedback
  - Log session for analytics

memory_storage:
  session:
    id: "session_xxx"
    topic: "photosynthesis"
    age_range: [8, 10]
    technique: "connection"
    lyrics: "..."
    style: "..."
    timestamp: "2026-02-08T..."
    quality_score: 0.85

output:
  final_response:
    success: true
    lyrics: "..."
    style: "..."
    metadata:
      topic: "..."
      technique: "..."
      session_id: "..."
```

---

## Pipeline State Machine

```typescript
type PipelineState =
  | { step: 'RECEIVE'; input: RawInput }
  | { step: 'UNDERSTAND'; validated: ValidatedInput; context?: never }
  | { step: 'REMEMBER'; context: GatheredContext; memory?: never }
  | { step: 'DECIDE'; memory: MemoryContext; decision?: never }
  | { step: 'CREATE'; decision: TechniqueDecision; drafts?: never }
  | { step: 'REFINE'; drafts: DraftOutputs; refined?: never }
  | { step: 'DELIVER'; refined: RefinedOutputs }
  | { step: 'COMPLETE'; final: FinalOutput };
```

---

## Error Handling

```yaml
step_failures:
  RECEIVE:
    - Invalid input → Return validation error
    - Inappropriate topic → Reject with reason

  UNDERSTAND:
    - Topic too broad → Request narrowing
    - Topic not educational → Suggest alternatives

  REMEMBER:
    - Memory unavailable → Continue without (graceful degradation)

  DECIDE:
    - Ambiguous technique → Default to age-based choice

  CREATE:
    - Generation failed → Retry with simplified prompt
    - API error → Exponential backoff

  REFINE:
    - Quality below threshold → Maximum 2 retries
    - Still poor after retries → Return with warning

  DELIVER:
    - Memory storage failed → Continue, log error
```

---

## Version

```yaml
version: 1.0.0
type: agent-knowledge-document
purpose: Define agent reasoning process through generation pipeline
```
