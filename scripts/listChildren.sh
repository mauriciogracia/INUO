#!/usr/bin/env bash
# INUO listChildren shell wrapper
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/listChildren.js" "$@"
