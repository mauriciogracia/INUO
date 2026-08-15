#!/usr/bin/env bash
# scripts/find-failing-tests.sh
# Runs each test file individually to locate and report failing suites.

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Build first
npm run build --silent

# Run JS runner
node scripts/find-failing-tests.js "$@"
