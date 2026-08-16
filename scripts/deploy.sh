#!/usr/bin/env bash
# ==============================================================================
# INUO Deployment Launcher Script (`scripts/deploy.sh`)
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-compose}"

echo -e "\033[36m=== INUO Deployment Launcher ===\033[0m"
node "$DIR/scripts/deploy.js" "$TARGET"
