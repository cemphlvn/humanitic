#!/bin/bash
# Truth Technician Compliance Checker
# Usage: ./check-compliance.sh <instance-path>
#
# "we can help suggest to the truthful beauty"

set -e

INSTANCE_PATH="${1:-.}"
LEVEL=0
ISSUES=()

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║              TRUTH TECHNICIAN — COMPLIANCE CHECK                          ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Checking: $INSTANCE_PATH"
echo ""

# Level 1: Observer — system_truths exists
echo "▶ Level 1: Observer"
if [ -f "$INSTANCE_PATH/.machinistic_intelligence/system_truths.yaml" ] || \
   [ -f "$INSTANCE_PATH/system_truths.yaml" ]; then
  echo "  ✓ system_truths.yaml found"
  LEVEL=1

  # Check for required fields
  if grep -q "observation:" "$INSTANCE_PATH/.machinistic_intelligence/system_truths.yaml" 2>/dev/null || \
     grep -q "observation:" "$INSTANCE_PATH/system_truths.yaml" 2>/dev/null; then
    echo "  ✓ Contains observation fields"
  else
    ISSUES+=("Missing observation fields in system_truths")
  fi

  if grep -q "implication:" "$INSTANCE_PATH/.machinistic_intelligence/system_truths.yaml" 2>/dev/null || \
     grep -q "implication:" "$INSTANCE_PATH/system_truths.yaml" 2>/dev/null; then
    echo "  ✓ Contains implication fields"
  else
    ISSUES+=("Missing implication fields in system_truths")
  fi
else
  echo "  ✗ system_truths.yaml not found"
  ISSUES+=("No system_truths.yaml")
fi

# Level 2: Integrator — agentic_stats log exists
echo ""
echo "▶ Level 2: Integrator"
STATS_FILES=$(find "$INSTANCE_PATH" -name ".agentic_stats_*.jsonl" 2>/dev/null | head -1)
if [ -n "$STATS_FILES" ]; then
  echo "  ✓ agentic_stats log found: $STATS_FILES"
  LEVEL=2

  # Check for metrics
  if grep -q '"metrics"' "$STATS_FILES" 2>/dev/null; then
    echo "  ✓ Contains metrics data"
  else
    echo "  ○ No metrics data (optional)"
  fi
else
  echo "  ○ No agentic_stats logs found (Level 2 not achieved)"
fi

# Level 3: Federator — shareable stats exist
echo ""
echo "▶ Level 3: Federator"
if [ -n "$STATS_FILES" ] && grep -q '"shareable":true' "$STATS_FILES" 2>/dev/null; then
  echo "  ✓ Shareable stats enabled"
  LEVEL=3
else
  echo "  ○ No shareable stats (Level 3 not achieved)"
fi

# Level 4: Truth Technician — full compliance
echo ""
echo "▶ Level 4: Truth Technician"
if [ -f "$INSTANCE_PATH/.truth-technician-certified" ]; then
  echo "  ✓ Certified by Truth Technician"
  LEVEL=4
else
  echo "  ○ Not yet certified (apply at /truth-technician/)"
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

if [ ${#ISSUES[@]} -gt 0 ]; then
  echo "ISSUES FOUND:"
  for issue in "${ISSUES[@]}"; do
    echo "  ✗ $issue"
  done
  echo ""
fi

case $LEVEL in
  0) echo "RESULT: Not Compliant" ;;
  1) echo "RESULT: Level 1 — Observer ✓" ;;
  2) echo "RESULT: Level 2 — Integrator ✓" ;;
  3) echo "RESULT: Level 3 — Federator ✓" ;;
  4) echo "RESULT: Level 4 — Truth Technician ✓" ;;
esac

echo ""
echo "\"we can help suggest to the truthful beauty\""
echo ""

exit 0
