#!/usr/bin/env bash
# Humanitic Sync — handles the two-repo submodule dance
# Run from humanitic root: ./scripts/sync.sh "commit message"

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MSG="${1:-sync}"
PLUGIN_CHANGED=false
PARENT_CHANGED=false

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Humanitic Sync"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check plugin status
if [ -n "$(git -C plugin status --porcelain)" ]; then
  PLUGIN_CHANGED=true
  echo -e "${YELLOW}plugin/${NC} has changes"
fi

# Check parent status (excluding plugin)
if [ -n "$(git status --porcelain --ignore-submodules)" ]; then
  PARENT_CHANGED=true
  echo -e "${YELLOW}humanitic/${NC} has changes"
fi

if ! $PLUGIN_CHANGED && ! $PARENT_CHANGED; then
  echo "Nothing to sync."
  exit 0
fi

# Step 1: Plugin first (if changed)
if $PLUGIN_CHANGED; then
  echo ""
  echo "─── plugin (meta-agentic-loop) ───"
  git -C plugin add -A
  git -C plugin commit -m "$MSG

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
  git -C plugin push origin main
  echo -e "${GREEN}✓ plugin pushed${NC}"
fi

# Step 2: Parent (if changed, or plugin updated)
if $PARENT_CHANGED || $PLUGIN_CHANGED; then
  echo ""
  echo "─── humanitic ───"
  git add -A
  git commit -m "$MSG

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
  git push origin main
  echo -e "${GREEN}✓ humanitic pushed${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Sync complete${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
