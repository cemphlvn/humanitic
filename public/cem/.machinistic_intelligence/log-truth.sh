#!/bin/bash
# Log System Truth — Append meta-learning observations
# Usage: ./log-truth.sh "category" "observation" "implication"

set -e

TRUTH_FILE="$(dirname "$0")/system_truths.yaml"

if [ $# -lt 2 ]; then
  echo "Usage: $0 <category> <observation> [implication]"
  echo "Categories: token_usage, architecture, performance, policy_suggestion, pattern"
  exit 1
fi

CATEGORY="$1"
OBSERVATION="$2"
IMPLICATION="${3:-No implication noted.}"
DATE=$(date +%Y-%m-%d)

# Get next ID
LAST_ID=$(grep -o 'ST-[0-9]*' "$TRUTH_FILE" | tail -1 | sed 's/ST-//')
NEXT_ID=$((LAST_ID + 1))
NEXT_ID_PADDED=$(printf "ST-%03d" $NEXT_ID)

# Append new truth
cat >> "$TRUTH_FILE" << EOF

  - id: $NEXT_ID_PADDED
    discovered: $DATE
    category: $CATEGORY
    observation: |
      $OBSERVATION
    implication: $IMPLICATION
EOF

echo "Logged: $NEXT_ID_PADDED ($CATEGORY)"
