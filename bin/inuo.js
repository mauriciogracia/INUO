#!/usr/bin/env node

const { startInteractiveShell, dispatchSingleCommand } = require('../dist/cli/shell');

const args = process.argv.slice(2);

if (args.length === 0) {
  startInteractiveShell(process.cwd());
} else {
  dispatchSingleCommand(args, process.cwd());
}
