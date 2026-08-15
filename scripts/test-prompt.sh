#!/usr/bin/env bash
# scripts/test-prompt.sh
# Tests the active Gemini API key and model against the Google GenAI endpoint.

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

find_node() {
  for n in node node.exe /mnt/c/Program\ Files/nodejs/node.exe /c/Program\ Files/nodejs/node.exe; do
    if command -v "$n" >/dev/null 2>&1; then
      command -v "$n"
      return 0
    fi
  done
  return 1
}

NODE_BIN="$(find_node || echo node)"

"$NODE_BIN" scripts/test-prompt.js "$@"
