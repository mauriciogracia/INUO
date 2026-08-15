#!/usr/bin/env bash
# scripts/update-graph.sh
# Updates codebase AST knowledge graph using graphify.

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

if command -v graphify >/dev/null 2>&1; then
  graphify . --update --code-only "$@"
else
  echo "[graphify] CLI not in PATH. Please install or ensure graphify is available."
  exit 1
fi
