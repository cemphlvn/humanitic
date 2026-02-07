# Suno Prompt Guide — Agent Knowledge Document

> **Best practices for Suno AI music generation**
> Optimized for educational children's songs

---

## Suno Basics

```yaml
what_is_suno: AI music generation from text prompts
two_modes:
  simple: Single prompt generates everything
  custom: Separate lyrics + style prompts (WE USE THIS)

our_approach: Custom mode for maximum control over educational content
```

---

## Style Prompt Structure

### The 4-7 Rule

```yaml
principle: Style prompts work best with 4-7 descriptors
too_few: Generic, unfocused output
too_many: Confused, contradictory output
sweet_spot: 5-6 well-chosen descriptors
```

### Essential Components

```yaml
required:
  genre: The musical category (pop, folk, electronic, etc.)
  mood: Emotional atmosphere (joyful, curious, gentle, etc.)
  instrumentation: Key instruments (guitar, piano, synths, etc.)
  vocal_style: Voice characteristics (child choir, clear, expressive, etc.)

optional_but_valuable:
  tempo: Speed indicator (upbeat, moderate, slow)
  era: Decade influence (80s, modern, etc.)
  special_elements: Unique features (clapping, call-response, etc.)
```

### Format Pattern

```
[genre], [mood] [tempo], [instruments], [vocal_style], [special elements]
```

---

## Age-Appropriate Genre Selection

### Ages 5-7

```yaml
recommended_genres:
  - nursery rhyme style
  - children's pop
  - playground chant
  - lullaby (for calm topics)
  - bouncy children's music

avoid:
  - rock
  - electronic/EDM
  - anything with "intense" or "dark"
  - complex jazz

example:
  "nursery rhyme style, cheerful and bouncy, 100 BPM,
   ukulele and piano, innocent child vocals,
   clapping and simple percussion"
```

### Ages 8-10

```yaml
recommended_genres:
  - educational pop
  - children's pop-rock
  - folk-inspired children's
  - upbeat acoustic
  - story-song style

avoid:
  - heavy metal
  - dark electronic
  - overly complex arrangements

example:
  "educational children's pop, curious and energetic, 110 BPM,
   acoustic guitar and light drums, clear expressive vocals,
   sing-along chorus with harmonies"
```

### Ages 11-14

```yaml
recommended_genres:
  - pop
  - indie pop
  - light rock
  - contemporary folk
  - electronic pop (light)

avoid:
  - explicit content genres
  - overly aggressive styles
  - dark/gothic themes

example:
  "indie pop, thoughtful and engaging, 115 BPM,
   guitars and synth pads with drums,
   youthful expressive vocals, building dynamics"
```

---

## Mood Vocabulary

### For Curiosity/Learning

```yaml
positive_engagement:
  - curious
  - wondering
  - exploratory
  - discovery
  - fascinated

joyful_learning:
  - playful
  - cheerful
  - bright
  - sunny
  - delighted

focused_attention:
  - clear
  - gentle focus
  - calm concentration
  - steady
```

### For Memorization

```yaml
catchy_memorable:
  - bouncy
  - catchy
  - rhythmic
  - toe-tapping
  - infectious

repetitive_reinforcement:
  - chant-like
  - repetitive
  - marching
  - call-and-response
```

### For Connection/Understanding

```yaml
building_comprehension:
  - building
  - layered
  - evolving
  - growing
  - unfolding

emotional_resonance:
  - heartfelt
  - warm
  - connected
  - meaningful
```

---

## Instrumentation Guide

### Kid-Friendly Instruments

```yaml
always_safe:
  - acoustic guitar
  - ukulele
  - piano
  - xylophone
  - hand claps
  - tambourine
  - bells

good_for_energy:
  - light drums
  - percussion
  - bass (not heavy)
  - electric guitar (clean tone)

for_older_kids:
  - synths
  - drum machine
  - electric bass
  - full band arrangement

avoid:
  - heavy distorted guitars
  - aggressive drums
  - dark synths
  - orchestral (too complex usually)
```

### Instrument Combinations

```yaml
memorization_songs:
  - "ukulele and piano with claps"
  - "acoustic guitar and hand percussion"
  - "piano and xylophone with tambourine"

connection_songs:
  - "acoustic guitar building to full band"
  - "piano and strings with light drums"
  - "guitar layers with gentle synths"
```

---

## Vocal Style Descriptors

### Age-Appropriate Vocals

```yaml
ages_5_7:
  - innocent child vocals
  - sweet clear voice
  - nursery-style singing
  - gentle child choir

ages_8_10:
  - clear youthful vocals
  - expressive child voice
  - energetic young singer
  - sing-along friendly voice

ages_11_14:
  - youthful expressive vocals
  - clear teenage voice
  - contemporary young singer
  - relatable young vocals
```

### Vocal Techniques

```yaml
for_memorization:
  - call and response
  - sing-along chorus
  - chant sections
  - echo vocals

for_connection:
  - storytelling voice
  - expressive dynamics
  - narrative vocals
  - emotional range
```

---

## Special Elements

### Educational Enhancements

```yaml
memory_aids:
  - clapping patterns
  - stomping beats
  - finger snaps
  - body percussion cues

engagement_boosters:
  - echo sections
  - call and response
  - audience participation cues
  - singable hooks

attention_keepers:
  - building dynamics
  - surprise elements
  - rhythmic variations
  - instrumental breaks
```

---

## Negative Prompts

### What to Avoid

```yaml
exclude_elements:
  - "no electronic clap" (if unwanted)
  - "no reverb-heavy" (for clarity)
  - "no auto-tune" (for natural sound)
  - "no explicit content" (always for kids)

use_sparingly: Negative prompts should be specific, not general
```

---

## Complete Examples

### Example 1: Memorization (Ages 6)

```yaml
topic: Planets of the solar system
technique: memorization
age: 6

style_prompt: |
  nursery rhyme style, cheerful and bouncy, 100 BPM,
  ukulele and piano with hand claps, sweet child vocals,
  catchy sing-along with call and response

word_count: 27
descriptor_count: 6
```

### Example 2: Connection (Ages 9)

```yaml
topic: Water cycle
technique: connection
age: 9

style_prompt: |
  educational children's pop, curious and wonder-filled, 108 BPM,
  acoustic guitar building to full arrangement with bells,
  clear expressive young vocals, storytelling with building dynamics

word_count: 26
descriptor_count: 6
```

### Example 3: Connection (Ages 12)

```yaml
topic: How cells work
technique: connection
age: 12

style_prompt: |
  indie pop, thoughtful and engaging, 112 BPM,
  guitars and synth layers with steady drums,
  youthful expressive vocals, building from simple to complex

word_count: 23
descriptor_count: 6
```

---

## Quality Checklist

```yaml
before_finalizing_style:
  - [ ] 4-7 descriptors total?
  - [ ] Genre is age-appropriate?
  - [ ] Mood matches learning technique?
  - [ ] Instruments are kid-friendly?
  - [ ] Vocals specified clearly?
  - [ ] No conflicting descriptors?
  - [ ] Supports educational content (not distracts)?
```

---

## Sources

- [Complete Suno Prompts Guide](https://travisnicholson.medium.com/complete-list-of-prompts-styles-for-suno-ai-music-2024-33ecee85f180)
- [How to Structure Suno Prompts](https://sunoaiwiki.com/tips/2024-05-04-how-to-structure-prompts-for-suno-ai/)
- [Suno AI Meta Tags Guide](https://jackrighteous.com/en-us/pages/suno-ai-meta-tags-guide)

---

## Version

```yaml
version: 1.0.0
type: agent-knowledge-document
purpose: Guide Style Agent in creating effective Suno prompts
```
