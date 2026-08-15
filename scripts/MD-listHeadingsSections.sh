#!/usr/bin/env bash
# MD-listHeadingsSections shell wrapper
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/MD-listHeadingsSections.js" "$@"
