#!/usr/bin/env bash
# moveFile.sh — Move a file or directory from SOURCE to DESTINATION
# Usage: bash scripts/moveFile.sh <source> <destination>
# Example: bash scripts/moveFile.sh tech-specs docs/tech-specs

set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 <source> <destination>"
  echo "Example: $0 tech-specs docs/tech-specs"
  exit 1
fi

SOURCE="$1"
DEST="$2"

if [ ! -e "$SOURCE" ]; then
  echo "ERROR: Source '$SOURCE' does not exist."
  exit 1
fi

# Create destination parent directory if it doesn't exist
DEST_PARENT="$(dirname "$DEST")"
if [ ! -d "$DEST_PARENT" ]; then
  mkdir -p "$DEST_PARENT"
  echo "Created parent directory: $DEST_PARENT"
fi

mv -v "$SOURCE" "$DEST"
echo "Moved '$SOURCE' → '$DEST'"
