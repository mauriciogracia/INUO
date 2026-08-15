#!/usr/bin/env bash
# scripts/setup-llm.sh
# Interactive Zero-Exposure Setup Assistant for AI keys and model auto-discovery.
#
# Usage:
#   ./scripts/setup-llm.sh              # Interactive prompt
#   ./scripts/setup-llm.sh <apiKey>     # Direct key argument

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Ensure build is ready
npm run build --silent

node scripts/setup-llm.js "$@"
