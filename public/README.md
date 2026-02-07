# Public — Humanitic Ecosystem Commons

> Forever open. Contributions tokenized. Credit chains preserved.

## Structure

```
public/
├── {username}/           ← Contributor namespace
│   ├── _vector.yaml      ← Contribution vector (timestamped, signed)
│   └── {projects}/       ← Public projects
└── README.md
```

## Principles

| Principle | Description |
|-----------|-------------|
| **Forever Open** | Code remains permanently accessible |
| **Vector Tracking** | Every contribution tagged with user + timestamp |
| **Founder Rewards** | Curiosity founders rewarded by contribution degree |
| **Credit Chains** | Derivative works credit original vectors |
| **On-Chain Signing** | Contributions signed for provenance |

## License

All contributions in `/public/` are licensed under [license TBD] with:
- Full usage rights
- Attribution required (credit chain)
- Monetization rights described per-project
- Original contributor tokenized credit

## Contributing

```bash
# Tag your contribution
./scripts/tag-contribution.sh public/yourname/project "description"
```

This timestamps and signs the contribution to your vector.
