#!/usr/bin/env bash
# INUO Platform Launcher (ASCII Web Client by default)

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

if [ $# -eq 0 ]; then
  # Interactive mode: launch ASCII Web Client connected to Express Web Server
  node "$DIR/scripts/asciiWebClient.js"
else
  # Command mode: execute single CLI command directly
  node "$DIR/bin/inuo.js" "$@"
fi
