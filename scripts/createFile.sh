#!/usr/bin/env bash
# createFile.sh — Create an empty file (and any parent directories needed)
# Usage: bash scripts/createFile.sh <filepath>
# Example: bash scripts/createFile.sh docs/tech-specs/tech-debts.md

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <filepath>"
  echo "Example: $0 docs/tech-specs/tech-debts.md"
  exit 1
fi

FILEPATH="$1"
PARENT="$(dirname "$FILEPATH")"

if [ ! -d "$PARENT" ]; then
  mkdir -p "$PARENT"
  echo "Created parent directory: $PARENT"
fi

if [ -e "$FILEPATH" ]; then
  echo "File already exists: $FILEPATH"
else
  touch "$FILEPATH"
  echo "Created file: $FILEPATH"
fi
