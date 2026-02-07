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
# 1. Tag your contribution (timestamps + hashes)
./scripts/tag-contribution.sh public/yourname/project "description"

# 2. Sign on Arweave (permanent provenance)
./scripts/sign-arweave.sh contrib-1234567890
```

## On-Chain Signing

Contributions are signed to **Arweave** for permanent provenance:

| Field | Description |
|-------|-------------|
| `hash` | SHA256 of contribution contents |
| `timestamp` | ISO-8601 when tagged |
| `signature` | `ar://{tx_id}` — permanent Arweave link |

### Setup Arweave

```bash
npm install -g arkb
# Get wallet from https://arweave.app/wallet
# Fund with AR tokens
mkdir -p ~/.arweave
mv wallet.json ~/.arweave/
```

### Verify Contribution

```bash
# View on Arweave
open https://arweave.net/{tx_id}
```
