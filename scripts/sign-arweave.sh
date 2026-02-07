#!/usr/bin/env bash
# Sign Contribution on Arweave — permanent provenance
# Usage: ./scripts/sign-arweave.sh <contrib-id> [wallet-path]
#
# Requires: npm install -g arkb
# Wallet: https://arweave.app/wallet

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CONTRIB_ID="$1"
WALLET="${2:-$HOME/.arweave/wallet.json}"

if [ -z "$CONTRIB_ID" ]; then
  echo "Usage: ./scripts/sign-arweave.sh <contrib-id> [wallet-path]"
  echo ""
  echo "  contrib-id: ID from _vector.yaml (e.g., contrib-1234567890)"
  echo "  wallet-path: Arweave wallet JSON (default: ~/.arweave/wallet.json)"
  echo ""
  echo "Setup:"
  echo "  1. npm install -g arkb"
  echo "  2. Get wallet from https://arweave.app/wallet"
  echo "  3. Fund with AR tokens"
  exit 1
fi

if [ ! -f "$WALLET" ]; then
  echo "Error: Wallet not found at $WALLET"
  echo "Get one from https://arweave.app/wallet"
  exit 1
fi

# Find contribution in any _vector.yaml
VECTOR_FILE=$(grep -rl "id: $CONTRIB_ID" public/*/_ 2>/dev/null | head -1)

if [ -z "$VECTOR_FILE" ]; then
  echo "Error: Contribution $CONTRIB_ID not found"
  exit 1
fi

# Extract contribution data
CONTRIB_DATA=$(awk "/id: $CONTRIB_ID/,/^-|^$/" "$VECTOR_FILE" | head -n -1)

if [ -z "$CONTRIB_DATA" ]; then
  echo "Error: Could not extract contribution data"
  exit 1
fi

# Create temporary file with contribution data
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE" << EOF
---
type: humanitic-contribution
version: 1.0
signed: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
---
$CONTRIB_DATA
EOF

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Signing to Arweave"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat "$TEMP_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if arkb is installed
if ! command -v arkb &> /dev/null; then
  echo ""
  echo "arkb not installed. Install with:"
  echo "  npm install -g arkb"
  echo ""
  echo "Dry run - would upload above data to Arweave"
  rm "$TEMP_FILE"
  exit 0
fi

# Upload to Arweave
echo "Uploading to Arweave..."
RESULT=$(arkb deploy "$TEMP_FILE" --wallet "$WALLET" --tag-name "App-Name" --tag-value "Humanitic" --tag-name "Type" --tag-value "Contribution" --tag-name "Contrib-ID" --tag-value "$CONTRIB_ID" 2>&1)

# Extract transaction ID
TX_ID=$(echo "$RESULT" | grep -oE "[a-zA-Z0-9_-]{43}" | head -1)

if [ -z "$TX_ID" ]; then
  echo "Error: Could not get transaction ID"
  echo "$RESULT"
  rm "$TEMP_FILE"
  exit 1
fi

# Update vector file with signature
sed -i.bak "s|id: $CONTRIB_ID|id: $CONTRIB_ID\n  arweave_tx: $TX_ID|" "$VECTOR_FILE"
sed -i.bak "/$CONTRIB_ID/,/signature:/{s|signature: pending.*|signature: ar://$TX_ID|}" "$VECTOR_FILE"
rm -f "${VECTOR_FILE}.bak"

rm "$TEMP_FILE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Signed on Arweave"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TX: $TX_ID"
echo "  URL: https://arweave.net/$TX_ID"
echo "  Viewblock: https://viewblock.io/arweave/tx/$TX_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
