# Song Flow Mastery Brain

> TYPE: Mastery Brain
> DOMAIN: Song Flow Mastery
> VERSION: 1.0.0

---

## Curiosity Vector

```yaml
current_focus: "Shorter songs with vivid mental imagery that flow"

open_questions:
  - What makes a 60-second song as memorable as a 3-minute one?
  - How to compress narrative without losing emotional flow?
  - Best hook density for educational retention by age?
  - How do language-native rhythms affect memorability?
  - Can action anchors ([clap], [stomp]) replace verses?

next_explorations:
  - A/B test 60s vs 90s songs on retention
  - Study viral educational TikTok songs (structure patterns)
  - Map Kodály method to AI song generation
```

---

## Accumulated Truths

### Techniques (Validated)

| Technique | Description | Source |
|-----------|-------------|--------|
| **focal_point** | One high note anchors entire melody | MasterClass 2026 |
| **stepwise_motion** | Move in half/whole steps, occasional leaps | Songwriting fundamentals |
| **hook_first** | Write chorus first, work backward | Professional practice |
| **three_note_start** | Kodály method (sol, mi, la) for children | BYU Arts / HeadStart |
| **repetition_magic** | 3-5 repetitions = memory lock | Educational psychology |
| **action_anchors** | [clap], [stomp], [snap] reinforce learning | Multi-sensory learning |
| **rhyme_rhythm** | Rhyme patterns captivate, create pulse | Child development research |

### Anti-Patterns (Avoid)

| Anti-Pattern | Why It Fails |
|--------------|--------------|
| **verse_sprawl** | Too many verses dilute the hook, attention wanders |
| **complexity_creep** | More notes ≠ more memorable; simple sticks |
| **prose_lyrics** | Sentences don't sing; phrases do |
| **translation_thinking** | Generating in English then translating kills native flow |
| **hook_burial** | Hook appears too late; should be in first 15 seconds |

### Breakthroughs (Evolves with Use)

```yaml
# This section grows as the agent learns from generations
breakthroughs: []
```

---

## Technique Library

### 1. Mental Image Cascade

**Purpose:** Create vivid mental pictures that flow naturally

**Pattern:**
```
concrete_object → action_verb → emotional_resonance → callback
```

**Example:**
```
Red balloon floats up high    [concrete → action]
Catches on the silver moon    [continuation]
Now I wonder, now I fly       [emotional resonance]
Red balloon... (red balloon)  [callback/hook]
```

**Rules:**
- One image per verse (max)
- Image should be visualizable in <2 seconds
- Action verb creates movement
- Callback creates loop in listener's mind

---

### 2. Compression Hooks

**Purpose:** Maximum impact in minimum words

**Pattern:**
```
3-5 syllable phrase + repeat 3x + ascending melody
```

**Examples:**
```
"We rise again"       (3 syllables, ascending)
"Count with me"       (3 syllables, call-response)
"Round and round"     (3 syllables, circular motion)
"One two three go!"   (4 syllables, action trigger)
```

**Rules:**
- Hook must appear in first 15 seconds
- Repeat at minimum every 8 bars
- Syllable count: 3-5 (never more than 7)

---

### 3. Narrative Pulse

**Purpose:** Story that moves with the beat

**Pattern:**
```
setup (4 bars) → twist (2 bars) → resolve (2 bars)
```

**Example (8-bar narrative):**
```
[Setup - 4 bars]
The caterpillar crawls so slow
Eating leaves from head to toe
Wraps up tight, goes to sleep
In a cozy blanket heap

[Twist - 2 bars]
But wait! What's happening inside?
Something magical can't hide!

[Resolve - 2 bars]
BUTTERFLY! Wings spread wide!
Now she soars across the sky!
```

**Rules:**
- Total narrative: 8-16 bars max
- Twist must be surprising but logical
- Resolve connects back to educational goal

---

### 4. Action Anchors

**Purpose:** Physical movement reinforces memory

**Pattern:**
```
[action_tag] aligned with lyrical beat
```

**Examples:**
```
One [clap] two [clap] buckle my shoe
Photosynthesis [stomp stomp] makes the leaves so green
H-2-O [snap snap snap] that's water, don't you know
```

**Rules:**
- Action on strong beats (1 and 3)
- Max 2 different actions per song
- Action should relate to content when possible
- Age 5-7: big motions (clap, stomp, jump)
- Age 8-10: rhythmic motions (snap, tap, sway)
- Age 11+: subtle or optional actions

---

### 5. Language-Native Flow

**Purpose:** Lyrics that feel natural in target language

**Turkish (SOV word order):**
```
Güneş doğdu, gün başladı     (Subject-Object-Verb maintained)
Kuşlar şarkı söylüyor        (Natural agglutination rhythm)
```

**Chinese (topic-prominence):**
```
太阳 - 它升起来了            (Topic-comment structure)
一二三 - 我们数数看          (Tonal melody alignment)
```

**English (stress-timed):**
```
The SUN comes UP, the DAY beGINS   (stressed syllables on beats)
The BIRDS all SING their SONGS     (iambic tendency)
```

**Rules:**
- Never translate; generate natively
- Respect syllable-stress alignment
- Use language-specific rhyme patterns
- Leverage native proverbs/idioms when educational

---

## Constraints (Hard Limits)

```yaml
duration:
  target: 60-90 seconds
  absolute_max: 120 seconds

structure:
  max_sections: 5  # Hook + Verse + Chorus + Verse + Bridge
  hook_frequency: every 8 bars minimum
  verse_max_lines: 4

tokens:
  output_limit: 1024  # Enforced in anthropic.ts

imagery:
  max_per_verse: 1 vivid image
  concreteness: high (visualizable in <2 sec)

repetition:
  hook_repeats: 3-5 times minimum
  key_concept: appears in every section
```

---

## Evolution Protocol

```yaml
triggers:
  - Generation produces <60s song with high memorability
  - User feedback indicates strong retention
  - New technique discovered in research
  - Pattern repeated 3+ times successfully

validation:
  - Technique must produce measurable improvement
  - Anti-pattern must cause observable problem
  - Breakthrough must be replicable

integration:
  - Add to ACCUMULATED_TRUTHS with source
  - Update TECHNIQUE_LIBRARY if novel method
  - Clear from open_questions if resolved
```

---

*This is a living document. It grows with the agent's curiosity.*
*Forward, always forward. 不进则退.*
