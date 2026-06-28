# Architecture Limit Tests

This document translates the Macro-Prompt Lab idea into contribution rules for three kinds of work:

- code architecture,
- repository architecture,
- designer thinking.

The purpose is to keep the app modular where modularity is earned, simple where simplicity is stronger, and legible enough that human designers, researchers, and coding agents can contribute without collapsing the mental model.

Note: a Devin MCP was requested, but no Devin tool is exposed in this session. These tests are grounded in the current repo, the committed architecture, and App Store/macOS constraints.

## App Store Boundary Conditions

The Mac App Store version should be treated as a native, local-first utility, not a thin wrapper.

Hard constraints:

- The app must provide real utility and native UI, not just a repackaged website or marketing surface.
- The app must be complete enough for review: stable, tested, with non-obvious features explained in review notes.
- Raw prompts and private libraries stay local by default.
- Any data collection or usage analytics requires clear consent.
- Any sharing with third-party AI, remote models, public commons, or cloud services requires explicit permission.
- Data access should be minimized to the task. Prefer paste, user-selected files, or share sheets over broad filesystem permissions.
- The user must be able to use the core app without login unless an account becomes directly relevant to a specific networked feature.

Sources to recheck before submission:

- Apple App Review Guidelines: Performance, Design, Privacy.
- Apple App Sandbox documentation.
- Apple Human Interface Guidelines for macOS layout, navigation, controls, accessibility, and privacy copy.

## Closest Architecture

The closest architecture for this product is:

```text
Native Mac shell
  -> local app core
    -> loop orchestrator
      -> earned modules
        -> adapters for engines and snippet kinds
```

Not:

```text
one giant desktop app class
```

Not:

```text
microservice-style local architecture
```

Not:

```text
web app in a wrapper
```

The Mac app should wrap the existing core loop. The core loop should not know SwiftUI, AppKit, windows, colors, or layout. The UI should not know vector math, prompt extraction details, or share anonymization internals.

## Code Architecture Limit Test

A code module earns existence only when it has an independent reason to change.

Use this checklist before adding a module:

1. Does this code change because of a different actor?
   Example: designer, researcher, inference engineer, privacy/governance owner.
2. Does this code protect a boundary?
   Example: raw prompt privacy, engine choice, snippet kind, ontology placement, contribution publishing.
3. Does this code need its own test fixture or failure mode?
   Example: share guard, assumption gate, ontology relation classification.
4. Does this code make `/learn`, `/experiment`, or `/contribute` clearer?
5. Would merging it into an existing module make that module harder to name?

If fewer than two answers are yes, keep it inside the existing module.

Current earned modules:

| Module | Owner Mind | Reason To Change |
| --- | --- | --- |
| `src/core/loop.ts` | systems designer | orchestration order changes |
| `src/assumptions/` | research/safety owner | public/private assumptions change |
| `src/snippets/` | prompt researcher | snippet kinds and extraction rules change |
| `src/adapters/inference/` | inference engineer | model backend changes |
| `src/ontology/` | knowledge architect | vector/kernel/graph placement changes |
| `src/evaluator/` | research evaluator | goal scoring changes |
| `src/library/` | persistence owner | storage backend changes |
| `src/share/` | privacy/governance owner | publish policy and anonymization change |
| `src/cli.ts` | app/operator owner | command surface changes |

Current non-modules:

| File | Why It Stays Small |
| --- | --- |
| `src/core/util.ts` | pure helpers |
| `src/core/patterns.ts` | shared data detectors |
| `src/core/intake.ts` | currently a small transform |
| `src/core/remembrance.ts` | thin append-only sink |

Graduation rule: `intake` earns a module when it supports multiple input sources such as paste, selected files, clipboard history, highlight ranges, and imported prompt archives.

## Repo Architecture Limit Test

The repo should be navigable by role. A contributor should know where to work after reading file names, not after reading every implementation file.

Recommended next repo shape:

```text
docs/
  product/
    mac-app.md
    app-store-boundaries.md
  architecture/
    limit-tests.md
    module-map.md
  design/
    design-principles.md
    ui-model.md

src/
  core/
  assumptions/
  snippets/
  adapters/
  ontology/
  evaluator/
  library/
  share/

app/
  mac/
    MacroPromptLab.xcodeproj
    MacroPromptLab/
      Features/
      DesignSystem/
      AppCoreBridge/

tests/
  fixtures/
  loop/
  assumptions/
  snippets/
  share/
```

Do not create this whole structure immediately. Create each folder when there are at least two real files or one real owner boundary.

Repo-level tests:

1. Can a designer find the UI model without reading TypeScript?
2. Can an inference contributor add MLX without touching snippets or evaluator?
3. Can a researcher modify assumptions without touching the app shell?
4. Can App Store/privacy review inspect every path where data can leave the machine?
5. Can a coding agent run one command and see the loop work?

If a repo change improves fewer than two of these, wait.

## Designer Thinking Limit Test

Design contributions are first-class, but they must attach to product objects rather than decoration.

A designer contribution earns a file, component, or decision record when it changes one of these objects:

- input editor,
- highlight annotation,
- concept-snippet presentation,
- intent-snippet presentation,
- ontology placement presentation,
- rejection explanation,
- research-goal profile,
- contribution consent flow,
- local/private state visibility.

Designer contributions should not start from brand surfaces, landing pages, or abstract mood boards. This app opens as a working lab.

The primary designer question is:

```text
What does the user need to see to trust why a snippet was kept, dropped, rejected, or shareable?
```

UI rules:

- Use one large editor as the main object.
- Keep concept-snippets and intent-snippets visually distinct.
- Use compact concept chips for 2-3 word carriers.
- Use one-line intent rows with the reasoning move visible.
- Show rejected fragments as useful results, not error states.
- Make the local/private state visible.
- Make contribution consent explicit per snippet.
- Do not let share/export controls appear enabled before consent and guard checks.
- Do not make the app feel like a chatbot; it is a lab/workbench.

## Human-Designer Contribution Model

Human designers should be able to contribute without editing inference or ontology code.

Recommended contribution artifacts:

| Artifact | Purpose |
| --- | --- |
| `docs/design/ui-model.md` | names the screens, panes, states, and object hierarchy |
| `docs/design/component-contracts.md` | describes expected props/state for UI components in plain language |
| `docs/design/rejection-states.md` | defines how gate failures appear without shaming the user |
| `docs/design/contribution-consent.md` | defines the opt-in share flow |
| `docs/design/accessibility-checklist.md` | text size, keyboard navigation, contrast, reduced motion |

Only create these when design work actually starts. Until then, this file is the limit test.

## Native Mac App Architecture

Recommended Swift-side architecture once the app shell begins:

```text
MacroPromptLabApp
  AppState
    LibraryStore
    GoalProfileStore
    AssumptionStore
    RunState

  Features/
    Workspace/
      PromptEditorView
      HighlightLayer
      RunControls
    Snippets/
      ConceptSnippetList
      IntentSnippetList
      SnippetDetailInspector
    Ontology/
      PlacementList
      NeighborInspector
    Rejections/
      RejectionList
      AssumptionExplanation
    Contribution/
      ConsentSheet
      SharePreview

  AppCoreBridge/
    LoopRunner
    SnippetDTO
    PlacementDTO
    GateVerdictDTO

  DesignSystem/
    LabColors
    LabTypography
    Controls
```

SwiftUI should own:

- layout,
- state presentation,
- local user interactions,
- keyboard shortcuts,
- accessibility,
- sandbox file pickers.

The TypeScript/core or future native core should own:

- gate semantics,
- snippet extraction,
- inference adapter behavior,
- ontology placement,
- goal evaluation,
- share guard.

The bridge should be boring data transfer. Avoid putting research policy in the bridge.

## Feature Graduation Tests

### Highlighting

Highlighting earns its own UI and data model because it changes the research object. User-highlighted spans are user claims:

```text
I believe this part carries prompt magic.
```

Store highlights as local annotations:

```ts
interface HighlightAnnotation {
  id: string;
  fragmentId: string;
  start: number;
  end: number;
  label: "user-magic" | "candidate" | "rejected" | "kept";
  note?: string;
}
```

Do not send highlights to public commons unless transformed into a de-identified lesson.

### MLX Local Inference

MLX earns only an inference adapter first:

```text
src/adapters/inference/mlx.ts
```

It does not earn changes to snippets, evaluator, or ontology until the adapter contract proves insufficient.

### Rich Ontology Graph

The ontology earns a richer persistence model when the app needs to display more than nearest-neighbor placement.

Add graph nodes only when they support a visible or evaluable behavior:

- concept,
- intent,
- effect,
- risk,
- evidence,
- contradiction,
- source family.

Do not add ontology categories just because they are intellectually attractive.

### Knowledge Commons

The commons earns a network module only after local file export works.

Order:

1. local `commons/commons.jsonl`,
2. export/share sheet,
3. signed upload,
4. account/reward layer.

Do not introduce accounts before contribution has value without accounts.

## App Review Risk Register

| Risk | Architecture Response |
| --- | --- |
| App is seen as a thin AI wrapper | Native workbench UI, offline loop, private library, ontology, contribution controls |
| Privacy concerns from pasted prompts | `.local` default, no raw prompt publishing, explicit share guard |
| Third-party AI ambiguity | Remote inference is opt-in and labeled; local heuristic/MLX path remains default |
| User-generated content moderation | Commons only receives de-identified shares; raw user content is not public UGC |
| Overbroad permissions | Paste/file picker/share sheet only; no broad filesystem scans |
| Incomplete app | Demo mode, local sample, complete learn/experiment/contribute loop |

## Current Decision

The closest next architecture is:

```text
Keep TypeScript core stable.
Add tests around the loop boundaries.
Then build a native SwiftUI Mac shell around the loop.
Let MLX enter as an inference adapter.
Let designers contribute through UI object contracts, not visual decoration alone.
```

The immediate next code work should be tests, not new architecture.

