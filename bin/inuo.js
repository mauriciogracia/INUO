#!/usr/bin/env node

const { startInteractiveShell, dispatchSingleCommand } = require('../dist/cli/shell');
const { startWebServer } = require('../dist/cli/webServer');

const args = process.argv.slice(2);

if (args[0] === 'web' || args[0] === 'server' || args[0] === 'ui') {
  const port = parseInt(args[1], 10) || 3000;
  startWebServer({ port, rootDir: process.cwd() });
} else if (args.length === 0) {
  startInteractiveShell(process.cwd());
} else {
  dispatchSingleCommand(args, process.cwd());
}
