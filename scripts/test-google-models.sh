#!/usr/bin/env bash
# scripts/test-google-models.sh
# Comprehensive Google AI / Gemini model testing utility.
#
# Usage:
#   ./scripts/test-google-models.sh                # Tests popular models
#   ./scripts/test-google-models.sh gemini-pro-latest  # Tests specific model
#   ./scripts/test-google-models.sh --list         # Lists all account models

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

find_node() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return 0
  fi
  if command -v node.exe >/dev/null 2>&1; then
    command -v node.exe
    return 0
  fi
  for n in /c/Program\ Files/nodejs/node.exe /mnt/c/Program\ Files/nodejs/node.exe; do
    if [ -x "$n" ]; then
      echo "$n"
      return 0
    fi
  done
  echo "node"
}

NODE_BIN="$(find_node || echo node)"

"$NODE_BIN" scripts/test-google-models.js "$@"
