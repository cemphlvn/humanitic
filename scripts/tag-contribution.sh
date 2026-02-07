#!/usr/bin/env bash
# Tag Contribution — timestamps and hashes contributions for tokenization
# Usage: ./scripts/tag-contribution.sh <path> "description"

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PATH_ARG="$1"
DESC="$2"

if [ -z "$PATH_ARG" ] || [ -z "$DESC" ]; then
  echo "Usage: ./scripts/tag-contribution.sh <path> \"description\""
  echo "  path: relative path to contribution (e.g., public/cem/project)"
  echo "  description: what was contributed"
  exit 1
fi

# Extract contributor from path (public/{contributor}/...)
CONTRIBUTOR=$(echo "$PATH_ARG" | cut -d'/' -f2)
VECTOR_FILE="public/$CONTRIBUTOR/_vector.yaml"

if [ ! -f "$VECTOR_FILE" ]; then
  echo "Error: Vector file not found: $VECTOR_FILE"
  echo "Create contributor namespace first."
  exit 1
fi

# Generate contribution data
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CONTRIB_ID="contrib-$(date +%s)"

# Hash the contribution (if path exists, hash contents; else hash description)
if [ -e "$PATH_ARG" ]; then
  if [ -d "$PATH_ARG" ]; then
    HASH=$(find "$PATH_ARG" -type f -exec sha256sum {} \; | sha256sum | cut -d' ' -f1)
  else
    HASH=$(sha256sum "$PATH_ARG" | cut -d' ' -f1)
  fi
else
  HASH=$(echo "$DESC" | sha256sum | cut -d' ' -f1)
fi

# Append to vector file
cat >> "$VECTOR_FILE" << EOF

- id: $CONTRIB_ID
  project: $PATH_ARG
  description: "$DESC"
  timestamp: $TIMESTAMP
  hash: $HASH
  signature: pending  # TODO: on-chain signing
EOF

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Contribution Tagged"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ID:          $CONTRIB_ID"
echo "  Contributor: $CONTRIBUTOR"
echo "  Project:     $PATH_ARG"
echo "  Description: $DESC"
echo "  Timestamp:   $TIMESTAMP"
echo "  Hash:        ${HASH:0:16}..."
echo "  Signature:   pending (on-chain)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Vector updated: $VECTOR_FILE"
