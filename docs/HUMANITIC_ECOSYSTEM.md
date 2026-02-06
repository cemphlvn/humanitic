# Humanitic Ecosystem

> "Curiosity founders rewarded by contribution degree"

---

## What Is It?

The Humanitic Ecosystem is an alternative to traditional open-source and proprietary models:

| Model | Code | Attribution | Rewards | Companies |
|-------|------|-------------|---------|-----------|
| Proprietary | Closed | None required | Owner only | Owner controls |
| Traditional OSS | Open | License notice | None | Anyone can fork |
| **Humanitic** | Forever open | Vector tracking | By contribution | Credit chain required |

---

## The Problem It Solves

Traditional open-source:
- Maintainers burn out without reward
- Companies extract value without giving back
- Attribution is minimal ("MIT License" in footer)
- Founders of key ideas get no recognition

Humanitic:
- Contributions tracked via vectors
- Companies must register credit chains
- Founders rewarded proportionally
- Ecosystem members support each other

---

## How It Works

### 1. Curiosity Vectors

Every contribution has a **fundamental thought vector**:

```yaml
# user/curiosities/ml-fundamentals/_vector.yaml
id: ml-fundamentals
owner: alice
created: 2026-02-06

dimensions:
  epistemic_humility: 0.7    # Knows limits of ML
  recursive_depth: 0.8       # Meta-learning patterns
  integration_breadth: 0.6   # Cross-domain applications
  practical_application: 0.9 # Production ML systems
  contribution_orientation: 0.85  # Shares freely
```

### 2. Contribution Chains

When Bob uses Alice's ML curiosity:

```yaml
# bob's project
contributions:
  - from: alice/ml-fundamentals
    degree: 0.6  # 60% derived from Alice's work
    type: code

  - from: carol/data-pipelines
    degree: 0.3  # 30% from Carol's work
    type: research
```

### 3. Company Formation

When Bob founds a company:

```yaml
# company_humanitic_registry.yaml
company: BobML Inc.
founded: 2027-01-15
humanitic_licensed: true

contribution_chain:
  - owner: alice
    curiosity: ml-fundamentals
    degree: 0.45  # Weighted contribution

  - owner: carol
    curiosity: data-pipelines
    degree: 0.25

  - owner: bob
    curiosity: ml-deployment
    degree: 0.30  # Bob's own contribution
```

### 4. Reward Distribution

If ecosystem has reward mechanism (grants, revenue share, etc.):

```
Total Pool: $100,000

Alice (0.45): $45,000
Carol (0.25): $25,000
Bob (0.30):   $30,000
```

---

## Ecosystem Modes in Init

```bash
# Join Humanitic Ecosystem
./scripts/init-ecosystem.sh --instance "my-project" --humanitic --github-user myuser

# Stay private
./scripts/init-ecosystem.sh --instance "my-project" --private --github-user myuser
```

### Humanitic Mode Enables:
- Vector tracking in `_vector.yaml`
- Contribution chain in `ecosystem.config.yaml`
- CEI proposals visible to ecosystem
- Mutual support access
- Founder credit registration

### Private Mode:
- No vector tracking
- No ecosystem contribution
- No mutual support access
- Traditional operation

---

## Mutual Support

Humanitic members can:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MUTUAL SUPPORT NETWORK                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Alice (ml-fundamentals)                                            │
│    │                                                                 │
│    ├── Can freely use Bob's ml-deployment                           │
│    ├── Can ask Carol for data-pipelines help                        │
│    └── Must help ecosystem members who ask                          │
│                                                                      │
│  Bob (ml-deployment)                                                │
│    │                                                                 │
│    ├── Can freely use Alice's ml-fundamentals                       │
│    ├── Gets credited when others use his work                       │
│    └── Contributes back improvements                                │
│                                                                      │
│  Carol (data-pipelines)                                             │
│    │                                                                 │
│    ├── Builds on Alice + Bob's work                                 │
│    ├── Credits them in her contribution chain                       │
│    └── Her improvements flow back to ecosystem                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Governance

The ecosystem is self-governing via CEI:

```
Proposal → CEI Review → Ecosystem Vote → Implementation

Vote weight = contribution_orientation × contribution_degree
```

### Meta-Principles (Immutable)
1. Forever open — cannot be changed
2. Founder credit — cannot be removed
3. Mutual support — cannot be monetized

### Policies (Changeable via CEI)
- Reward distribution formulas
- Contribution degree calculations
- Membership requirements

---

## Why "Humanitic"?

From "human" + "tic" (systematic):

- **Human**: Built by people, for people
- **Systematic**: Tracked, governed, rewarded fairly

It's not just open-source. It's **accountable open-source** where:
- Curiosity founders get recognized
- Companies can't extract without credit
- The ecosystem self-sustains through mutual support

---

## Quick Start

```bash
# 1. Fork a Humanitic repo
git clone https://github.com/you/humanitic-project

# 2. Initialize as Humanitic member
./scripts/init-ecosystem.sh --instance "my-project" --humanitic --github-user you

# 3. Develop your curiosity
/curiosity new "my-area-of-focus"

# 4. Contribute back
/cei propose process "My improvement"
/contribute submit PROP-...

# 5. Your vector now tracked, you're in the ecosystem
```

---

## Files

| File | Purpose |
|------|---------|
| `LICENSE-HUMANITIC.md` | Legal license text |
| `ecosystem.config.yaml` | Instance configuration |
| `_vector.yaml` | Contribution vectors |
| `contribution_chain.yaml` | Who contributed what |

---

*The power you need exists in the ecosystem you build together.*
