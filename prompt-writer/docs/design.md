# Design Specification — Suno Prompt Writer

> UI/UX design using MDB React UI Kit (Bootstrap Material Design). Frontend-first for Style prompts. Clean, playful, educational aesthetic.

---

## Design Philosophy

- **Material Design** — Clean cards, floating labels, smooth transitions
- **Playful but Professional** — This is for educators, not children directly
- **Information Dense** — Show the pipeline working, show the CSA thinking
- **Two-Panel Layout** — Input on left, output on right (desktop); stacked (mobile)

---

## Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | Deep Purple | `#6200EA` | Headers, primary buttons, active states |
| Secondary | Amber | `#FFB300` | Curiosity sparks, highlights, accents |
| Success | Teal | `#00BFA5` | Completed pipeline steps, success states |
| Background | Off-White | `#FAFAFA` | Page background |
| Surface | White | `#FFFFFF` | Cards, panels |
| Text Primary | Dark Gray | `#212121` | Body text |
| Text Secondary | Medium Gray | `#757575` | Labels, hints |
| CSA Accent | Indigo | `#304FFE` | CSA strategy display |
| Lyrics | Rose | `#F50057` | Lyrics output panel |
| Style | Cyan | `#00B8D4` | Style output panel |

---

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 (Page title) | Roboto | 32px | 700 |
| H2 (Section headers) | Roboto | 24px | 500 |
| H3 (Card titles) | Roboto | 20px | 500 |
| Body | Roboto | 16px | 400 |
| Labels | Roboto | 14px | 500 |
| Code/Output | Roboto Mono | 14px | 400 |
| Suno Tags | Roboto Mono | 13px | 700 |

---

## Page Layout

### Main Page: `/`

```
┌─────────────────────────────────────────────────────────┐
│  NAVBAR                                                  │
│  🎵 Suno Prompt Writer    [Session Memory] [Settings]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │   INPUT PANEL         │  │   OUTPUT PANEL            │ │
│  │                       │  │                           │ │
│  │  Subject:             │  │  ┌─ CSA Strategy ───────┐ │ │
│  │  [________________]   │  │  │ Pipeline: WONDER→..   │ │ │
│  │                       │  │  │ Logic Stick: LADDER   │ │ │
│  │  Age Group:           │  │  │ Curiosity: IMPOSSIBLE │ │ │
│  │  [K-6 ▼]              │  │  │ FACT                  │ │ │
│  │                       │  │  └───────────────────────┘ │ │
│  │  Prompt Type:         │  │                           │ │
│  │  ○ Lyrics             │  │  ┌─ LYRICS OUTPUT ──────┐ │ │
│  │  ○ Style              │  │  │ [Intro]               │ │ │
│  │  ● Both               │  │  │ [Verse 1, Soft]       │ │ │
│  │                       │  │  │ Walking through...     │ │ │
│  │  Learning Approach:   │  │  │ ...                    │ │ │
│  │  ○ Memorization       │  │  │ [Chorus, Powerful]     │ │ │
│  │  ● 6-Layer Andragogy  │  │  │ ...                    │ │ │
│  │                       │  │  └───────────────────────┘ │ │
│  │  Additional Context:  │  │                           │ │
│  │  [________________]   │  │  ┌─ STYLE OUTPUT ───────┐ │ │
│  │  [________________]   │  │  │ Children's pop,       │ │ │
│  │                       │  │  │ upbeat, playful,      │ │ │
│  │  ┌─────────────────┐  │  │  │ 110 BPM, C Major...  │ │ │
│  │  │  ✨ GENERATE     │  │  │  └───────────────────────┘ │ │
│  │  └─────────────────┘  │  │                           │ │
│  │                       │  │  [Copy Lyrics] [Copy Style]│ │
│  └──────────────────────┘  └──────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  PIPELINE VISUALIZATION                               ││
│  │  [Input] → [CSA] → [Lyrics] → [Style] → [Memory]     ││
│  │     ✓       ✓        ●         ○          ○           ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
├─────────────────────────────────────────────────────────┤
│  SESSION MEMORY DRAWER (collapsible)                     │
│  Previous: Photosynthesis (K-6) • Water Cycle (7-12)     │
└─────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Navbar (`MDBNavbar`)
- Fixed top, primary color background
- Brand with music note icon
- Session memory toggle button (right)
- Settings gear icon (right)

### 2. Input Panel (`MDBCard`)
- Elevated card with shadow-3
- **Subject Input** — `MDBInput` with floating label, required
- **Age Group** — `MDBSelect` dropdown: K-6, 7-12, 13-18, 18-24
- **Prompt Type** — `MDBRadio` group: Lyrics, Style, Both
- **Learning Approach** — `MDBRadio` group: Memorization, 6-Layer Andragogy
- **Additional Context** — `MDBTextArea` optional, 3 rows
- **Generate Button** — `MDBBtn` gradient purple→amber, ripple effect, full width
- Loading state: `MDBSpinner` inside button during generation

### 3. CSA Strategy Card (`MDBCard`)
- Accent border left (indigo)
- Shows CSA's decisions BEFORE output:
  - Selected Pipeline name
  - Selected Logic Stick
  - Selected Curiosity Technique(s)
  - Brief reasoning
- Animated entrance (fade-in from left)

### 4. Lyrics Output (`MDBCard`)
- Rose accent border top
- Monospace font for output
- Suno tags highlighted in bold purple
- Lyrics text in dark gray
- Copy button (top right corner)
- Character count badge (bottom right)

### 5. Style Output (`MDBCard`)
- Cyan accent border top
- Comma-separated tags displayed as `MDBBadge` pills
- Each tag category color-coded:
  - Genre: purple badge
  - Mood: amber badge
  - Tempo: teal badge
  - Instruments: gray badge
  - Vocal: rose badge
- Copy button (top right)
- Character count badge (bottom right, warn if >200)

### 6. Style Builder (Frontend — `/style-builder`)

**This is the dedicated frontend style builder page.**

```
┌─────────────────────────────────────────────────┐
│  STYLE BUILDER                                   │
│                                                  │
│  Genre:        [Children's Pop    ▼]             │
│  Sub-genre:    [Educational       ▼]             │
│  Mood:         [✓Playful] [✓Upbeat] [○Dreamy]   │
│  Tempo:        [====●==========] 110 BPM         │
│  Key:          [C Major ▼]                       │
│  Energy:       [Low ○] [Med ●] [High ○]          │
│                                                  │
│  Instruments:                                    │
│  [✓ Piano] [✓ Ukulele] [○ Guitar] [○ Drums]     │
│  [○ Synth] [○ Bass] [✓ Xylophone] [○ Strings]   │
│  [○ Trumpet] [○ Flute] [✓ Hand Claps]            │
│                                                  │
│  Vocals:                                         │
│  Gender: [○ Male] [● Female] [○ Both]            │
│  Style:  [✓ Clear] [○ Raspy] [○ Whisper]         │
│  Range:  [○ Alto] [● Soprano] [○ Tenor]          │
│                                                  │
│  Production:                                     │
│  [✓ Clean Mix] [○ Lo-fi] [○ Live Room]           │
│  [○ Stadium] [✓ Polished]                        │
│                                                  │
│  ┌─────────────────────────────────────────┐     │
│  │ PREVIEW:                                 │     │
│  │ Children's pop, educational, playful,    │     │
│  │ upbeat, 110 BPM, C Major, piano,         │     │
│  │ ukulele, xylophone, hand claps, clear    │     │
│  │ female soprano vocals, clean polished    │     │
│  │ mix                                      │     │
│  │                          [142/200 chars] │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  [Copy to Clipboard]  [Use in Generator]         │
└─────────────────────────────────────────────────┘
```

### 7. Pipeline Visualization (`MDBStepper`)
- Horizontal stepper showing pipeline stages
- States: pending (gray), active (pulsing amber), complete (teal check)
- Steps: Input → CSA → Lyrics → Style → Memory

### 8. Session Memory Drawer
- `MDBCollapse` or side drawer
- Lists previous generation sessions
- Each session shows: subject, age group, approach, timestamp
- Click to reload context

---

## Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥992px) | Two-column: Input left, Output right |
| Tablet (768-991px) | Two-column, narrower |
| Mobile (<768px) | Single column, stacked: Input → CSA → Output → Pipeline |

---

## Animation & Interaction

| Element | Animation |
|---------|-----------|
| Generate button | Ripple on click, spinner while loading |
| CSA Strategy card | Slide-in from left, 300ms ease |
| Pipeline steps | Sequential fill animation |
| Output cards | Fade-in-up, staggered 200ms |
| Style badges | Pop-in animation on generation |
| Copy button | Check icon + "Copied!" tooltip on click |

---

## State Management

| State | Scope | Method |
|-------|-------|--------|
| Form inputs | Local | React useState |
| Generation loading | Local | React useState |
| Pipeline stage | Local | React useState |
| CSA strategy | Response | Server → Client via API |
| Session memory | Persistent | Cognee + localStorage fallback |
| Style builder selections | Local | React useState with URL sync |

---

## Accessibility

- All inputs have proper labels and aria attributes
- Color contrast meets WCAG AA
- Keyboard navigation for all interactive elements
- Screen reader announces pipeline progress
- Focus management after generation completes
