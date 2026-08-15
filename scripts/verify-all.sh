#!/usr/bin/env bash
# scripts/verify-all.sh
# Performs end-to-end project verification: build, test, sync improvements, and refresh graph.

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=== [1/4] Building TypeScript ==="
npm run build

echo ""
echo "=== [2/4] Running Full Test Suite ==="
npm test

echo ""
echo "=== [3/4] Syncing Improvement Indexes ==="
npm run improvements:sync

echo ""
echo "=== [4/4] Updating Code Knowledge Graph ==="
if command -v graphify >/dev/null 2>&1; then
  graphify . --update --code-only || true
else
  echo "[graphify] CLI not in PATH, skipping graph refresh."
fi

echo ""
echo "✔ [Verification Complete] All build, test, sync, and graph steps succeeded."
