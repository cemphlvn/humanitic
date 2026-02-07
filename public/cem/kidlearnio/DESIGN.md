# KidLearnio — Design System

> **Curiosity-sparking education through music**
> Agentic Suno prompt writer for K-12

---

## Design Philosophy

```yaml
core_principle: "Curiosity over complexity"
aesthetic: Playful + Educational + Trustworthy
target: K-12 students, teachers, parents
accessibility: WCAG 2.1 AA compliant
```

### Design Pillars

1. **Spark** — Every element should evoke curiosity
2. **Clarity** — Complex concepts, simple presentation
3. **Delight** — Micro-interactions that reward engagement
4. **Trust** — Parent/teacher-friendly, safe feeling

---

## Color Palette

### Primary Colors (MDB Extended)

```css
:root {
  /* Curiosity Spark — Primary */
  --spark-primary: #6C63FF;      /* Vibrant purple — creativity */
  --spark-primary-light: #9D97FF;
  --spark-primary-dark: #4B44B3;

  /* Learning Growth — Secondary */
  --growth-secondary: #00D9A5;   /* Mint green — progress */
  --growth-secondary-light: #4FFFCB;
  --growth-secondary-dark: #00B389;

  /* Wonder — Accent */
  --wonder-accent: #FF6B9D;      /* Coral pink — delight */
  --wonder-accent-light: #FF9BBF;
  --wonder-accent-dark: #E64A7D;

  /* Knowledge — Neutral */
  --knowledge-dark: #2D3436;
  --knowledge-medium: #636E72;
  --knowledge-light: #B2BEC3;
  --knowledge-surface: #F8F9FA;
  --knowledge-background: #FFFFFF;

  /* Semantic */
  --success: #00C853;
  --warning: #FFB300;
  --error: #FF5252;
  --info: #2196F3;
}
```

### Age-Adaptive Palettes

```yaml
ages_5_7:
  saturation: high
  contrast: maximum
  shapes: rounded, bubbly

ages_8_10:
  saturation: medium-high
  contrast: high
  shapes: rounded corners

ages_11_14:
  saturation: medium
  contrast: standard
  shapes: subtle rounds
```

---

## Typography

### Font Stack

```css
:root {
  /* Headlines — Fun, readable */
  --font-display: 'Fredoka', 'Nunito', sans-serif;

  /* Body — Clear, friendly */
  --font-body: 'Inter', 'Nunito Sans', sans-serif;

  /* Code/Lyrics — Monospace rhythm */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Type Scale

```css
/* Modular scale: 1.25 (Major Third) */
--text-xs: 0.64rem;    /* 10.24px */
--text-sm: 0.8rem;     /* 12.8px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.25rem;    /* 20px */
--text-xl: 1.563rem;   /* 25px */
--text-2xl: 1.953rem;  /* 31.25px */
--text-3xl: 2.441rem;  /* 39px */
--text-4xl: 3.052rem;  /* 48.83px */
```

---

## Component Library

### Core Components (MDB + Custom)

```typescript
// Component hierarchy
components/
├── atoms/
│   ├── SparkButton.tsx      // Animated CTA buttons
│   ├── TopicChip.tsx        // Subject tags
│   ├── AgeSlider.tsx        // Age range selector
│   └── LoadingNotes.tsx     // Musical note loader
│
├── molecules/
│   ├── TopicInput.tsx       // Topic entry with suggestions
│   ├── StylePreview.tsx     // Suno style preview card
│   ├── LyricsDisplay.tsx    // Formatted lyrics output
│   └── MemoryIndicator.tsx  // Session context display
│
├── organisms/
│   ├── PromptGenerator.tsx  // Main generation interface
│   ├── AgentPipeline.tsx    // Visual pipeline progress
│   ├── OutputPanel.tsx      // Results with copy/export
│   └── SessionHistory.tsx   // Memory-based history
│
└── templates/
    ├── GeneratorLayout.tsx  // Main app layout
    └── OnboardingFlow.tsx   // First-time experience
```

### Button Variants

```tsx
// SparkButton.tsx
interface SparkButtonProps {
  variant: 'primary' | 'secondary' | 'wonder';
  size: 'sm' | 'md' | 'lg';
  sparkle?: boolean;  // Micro-animation on hover
  loading?: boolean;
}

// Usage
<SparkButton variant="primary" sparkle>
  Generate Song
</SparkButton>
```

### Card Styles

```tsx
// Output cards with musical theme
interface OutputCardProps {
  type: 'lyrics' | 'style';
  content: string;
  metadata: {
    topic: string;
    ageRange: [number, number];
    technique: 'memorization' | 'connection';
  };
}
```

---

## Layout System

### Grid

```css
/* 12-column responsive grid */
.container {
  max-width: 1200px;
  padding: 0 var(--space-4);
}

/* Breakpoints */
--bp-sm: 576px;
--bp-md: 768px;
--bp-lg: 992px;
--bp-xl: 1200px;
```

### Spacing Scale

```css
/* 4px base unit */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.5rem;    /* 24px */
--space-6: 2rem;      /* 32px */
--space-8: 3rem;      /* 48px */
--space-10: 4rem;     /* 64px */
```

---

## Iconography

### Icon Set

```yaml
primary_set: Phosphor Icons (playful, consistent)
style: duotone  # Two-color depth
size_base: 24px

key_icons:
  - music-notes     # Lyrics generation
  - palette         # Style generation
  - sparkle         # AI magic
  - brain           # Learning
  - child           # Age indicator
  - book-open       # Subject matter
  - arrow-circle    # Pipeline progress
  - memory          # Context/history
```

---

## Motion Design

### Principles

```yaml
feel: Bouncy, playful, not chaotic
duration_base: 200ms
easing_default: cubic-bezier(0.34, 1.56, 0.64, 1)  # Bounce
easing_smooth: cubic-bezier(0.4, 0, 0.2, 1)
```

### Key Animations

```css
/* Sparkle effect on generation */
@keyframes sparkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 0.8; }
}

/* Musical note loading */
@keyframes bounce-note {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Pipeline progress flow */
@keyframes flow-right {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

---

## UI States

### Generation Pipeline States

```typescript
type PipelineState =
  | 'idle'           // Ready to start
  | 'gathering'      // Reading context docs
  | 'analyzing'      // Understanding topic
  | 'applying'       // Applying techniques
  | 'generating'     // Creating prompts
  | 'complete'       // Done
  | 'error';         // Failed

// Visual representation
const stateColors = {
  idle: '--knowledge-light',
  gathering: '--spark-primary-light',
  analyzing: '--growth-secondary-light',
  applying: '--wonder-accent-light',
  generating: '--spark-primary',
  complete: '--success',
  error: '--error',
};
```

---

## Responsive Behavior

```yaml
mobile_first: true

breakpoint_adaptations:
  mobile:
    - Single column layout
    - Bottom sheet for outputs
    - Larger touch targets (48px min)
    - Simplified pipeline view

  tablet:
    - Two column (input | output)
    - Side panel for history
    - Full pipeline visualization

  desktop:
    - Three column (history | main | docs)
    - Floating action buttons
    - Rich animations enabled
```

---

## Accessibility

```yaml
requirements:
  - Color contrast: 4.5:1 minimum (AA)
  - Focus indicators: Visible, consistent
  - Keyboard navigation: Full support
  - Screen reader: ARIA labels
  - Reduced motion: Respect prefers-reduced-motion

kid_specific:
  - Large click/tap targets
  - Clear visual feedback
  - Simple language in UI
  - Visual + text labels
```

---

## Implementation Notes

### MDB Integration

```tsx
// app/layout.tsx
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './globals.css';  // Custom overrides

// Components need "use client" directive
'use client';
import { MDBBtn, MDBCard } from 'mdb-react-ui-kit';
```

### CSS Custom Properties Override

```css
/* Override MDB with kidlearnio palette */
:root {
  --mdb-primary: var(--spark-primary);
  --mdb-secondary: var(--growth-secondary);
  --mdb-font-family-sans-serif: var(--font-body);
}
```

---

## Version

```yaml
version: 1.0.0
created: 2026-02-08
framework: Next.js 16 + MDB React
author: cem (humanitic)
license: Humanitic Open
```
