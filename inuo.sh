#!/usr/bin/env bash
# INUO Platform Interactive Shell Launcher

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
node "$DIR/bin/inuo.js" "$@"
