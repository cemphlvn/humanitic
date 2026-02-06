# Humanitic Tools Index

> Open tools contributed by ecosystem members

---

## How Tools Become Open

When a Humanitic member develops a tool:

```yaml
tool_lifecycle:
  1. develop: Member creates tool in their curiosity
  2. mature: Tool proves useful, gains vector weight
  3. propose: Member proposes to open-source via CEI
  4. review: Ecosystem reviews, credits contribution chain
  5. merge: Tool added here with full attribution
  6. evolve: Community improves, credits propagate
```

---

## Tool Registry

| Tool | Contributor | Vector | Role |
|------|-------------|--------|------|
| *awaiting first contribution* | | | |

---

## Contributing a Tool

```bash
# From your instance
/tool propose "tool-name" --from curiosity/my-area

# Creates proposal with:
# - Tool source
# - Your _vector.yaml reference
# - Contribution degree calculation
```

---

## Tool Structure

Each tool in this index:

```
tools/{tool-name}/
├── tool.yaml           # Manifest + vector reference
├── README.md           # Usage documentation
├── src/                # Implementation
└── _contribution.yaml  # Full contribution chain
```

### tool.yaml Format

```yaml
name: tool-name
version: 1.0.0
description: What this tool does

contributor:
  user: github-username
  curiosity: curiosity-id
  vector: path/to/_vector.yaml

role: |
  When this tool should activate
  What capability it provides

requires:
  - dependency-tool

provides:
  - capability-name
```

---

## Librarian Integration

Tools are indexed by the Humanitic Librarian which:
- Organizes by capability, not category
- Tracks usage patterns across ecosystem
- Suggests tools based on context
- Maintains contribution heat maps

See: `../librarian/` for organization system

---

*Tools flow freely. Credit flows with them.*
