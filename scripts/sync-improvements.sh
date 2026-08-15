#!/usr/bin/env bash
# scripts/sync-improvements.sh
# Regenerates INDEX.md files for to-improve/ and improved/

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

node scripts/sync-improvements.js "$@"
