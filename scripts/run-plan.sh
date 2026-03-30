#!/usr/bin/env bash
# run-plan.sh — execute unchecked tasks in the implementation plan one at a time.
# Each task is dispatched to claude non-interactively. On success the checkbox is
# flipped to [x]. Skips tasks marked MANUAL.
#
# Usage: ./scripts/run-plan.sh [plan-file]
#   plan-file defaults to docs/plans/2026-03-30-pretext-smoke-implementation.md

set -euo pipefail

WORKTREE="$(cd "$(dirname "$0")/.." && pwd)"
PLAN="${1:-docs/plans/2026-03-30-pretext-smoke-implementation.md}"
PLAN_PATH="$WORKTREE/$PLAN"

# ~100k token budget: 20 turns × ~5k tokens/turn
MAX_TURNS=20

cd "$WORKTREE"

echo "Plan:     $PLAN_PATH"
echo "Worktree: $WORKTREE"
echo ""

while true; do
  # Find first unchecked, non-manual task (top-level only — no leading spaces)
  UNCHECKED=$(grep -n "^- \[ \] Task" "$PLAN_PATH" | grep -v "MANUAL" | head -1) || true

  if [[ -z "$UNCHECKED" ]]; then
    echo "All automatable tasks complete."
    exit 0
  fi

  LINE_NUM=$(cut -d: -f1 <<< "$UNCHECKED")
  TASK_LABEL=$(sed 's/^[0-9]*:- \[ \] //' <<< "$UNCHECKED")
  TASK_NUM=$(grep -oP '(?<=Task )\d+' <<< "$TASK_LABEL" | head -1)

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "→ $TASK_LABEL"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Extract the task body: from "## Task N:" header to next "## " heading or EOF
  TASK_BODY=$(awk "
    /^## Task ${TASK_NUM}:/{found=1; print; next}
    found && /^## /{exit}
    found{print}
  " "$PLAN_PATH")

  # Extract acceptance criteria lines for this task from the Progress checklist
  ACCEPTANCE=$(awk "
    /^- \[.?\] Task ${TASK_NUM}:/{found=1; next}
    found && /^  -/{print}
    found && !/^  /{exit}
  " "$PLAN_PATH")

  PROMPT="You are implementing a software task autonomously.

Working directory (git worktree, branch feature/pretext-smoke):
  $WORKTREE

Project: Next.js 15 / React 19 / TypeScript app. Run tests with: npm test

Full implementation plan for context:
---
$(cat "$PLAN_PATH")
---

YOUR TASK: implement ONLY the following (do not implement other tasks):

${TASK_BODY}

ACCEPTANCE CRITERIA (you must satisfy all of these before considering the task done):
${ACCEPTANCE}

When done:
1. Confirm all acceptance criteria are met (run the specified test commands and show output)
2. Confirm the commit was made with the exact message specified
3. Output the single line: TASK_COMPLETE"

  # Run claude non-interactively in the worktree
  if claude --dangerously-skip-permissions -p "$PROMPT" --max-turns "$MAX_TURNS"; then
    # Flip checkbox to done
    sed -i "${LINE_NUM}s/^- \[ \] Task/- [x] Task/" "$PLAN_PATH"
    echo ""
    echo "✓ Done: $TASK_LABEL"
    echo ""
  else
    EXIT=$?
    echo ""
    echo "✗ Failed: $TASK_LABEL (exit $EXIT)"
    exit 1
  fi
done
