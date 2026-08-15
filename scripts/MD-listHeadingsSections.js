#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function printHelp() {
  console.log(`
Usage: MD-listHeadingsSections.sh [options] <filePath>

Arguments:
  filePath                 Markdown file to extract headings from

Options:
  --max-depth, -d <num>    Maximum heading depth (1-6, default: 3)
  --line-numbers, -n       Show line numbers (default: true)
  -h, --help               Show this help message

Examples:
  ./scripts/MD-listHeadingsSections.sh tech-specs/main-specs-goals.md
  node scripts/MD-listHeadingsSections.js -d 2 tech-specs/dev-rules.md
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let filePath = '';
  let maxDepth = 3;
  let showLineNumbers = true;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg === '-d' || arg === '--max-depth') {
      maxDepth = parseInt(args[++i], 10) || 3;
    } else if (arg === '-n' || arg === '--line-numbers') {
      showLineNumbers = true;
    } else if (arg === '--no-line-numbers') {
      showLineNumbers = false;
    } else if (!arg.startsWith('-')) {
      filePath = arg;
    }
  }

  return { filePath, maxDepth, showLineNumbers };
}

function main() {
  const { filePath, maxDepth, showLineNumbers } = parseArgs();

  if (!filePath) {
    console.error('Error: Please provide a markdown file path.');
    printHelp();
    process.exit(1);
  }

  const targetPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(targetPath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(targetPath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (match) {
      const level = match[1].length;
      if (level <= maxDepth) {
        const indent = '  '.repeat(level - 1);
        const lineNum = showLineNumbers ? `[L${String(index + 1).padStart(4, ' ')}] ` : '';
        console.log(`${lineNum}${indent}${match[1]} ${match[2]}`);
      }
    }
  });
}

main();
