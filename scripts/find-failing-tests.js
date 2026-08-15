#!/usr/bin/env node
/**
 * scripts/find-failing-tests.js
 * Executes all test files individually and prints concise failure reports for failing suites.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testsDir = path.join(__dirname, '..', 'tests');
const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js')).sort();

console.log(`\x1b[36m🔍 Running ${files.length} test suites individually to locate any failures...\x1b[0m\n`);

let passedCount = 0;
let failedCount = 0;
const failedFiles = [];

for (const file of files) {
  const filePath = path.join(testsDir, file);
  const result = spawnSync(process.execPath, ['--test', filePath], {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status === 0) {
    passedCount++;
  } else {
    failedCount++;
    failedFiles.push({ file, stdout: result.stdout, stderr: result.stderr });
    console.log(`\x1b[31m✖ FAILED:\x1b[0m ${file}`);
    if (result.stdout) {
      const failureLines = result.stdout
        .split('\n')
        .filter(line => line.includes('not ok') || line.includes('AssertionError') || line.includes('Error:'));
      console.log(`  ${failureLines.join('\n  ')}`);
    }
    if (result.stderr) {
      console.error(`  ${result.stderr.trim()}`);
    }
    console.log('');
  }
}

console.log('----------------------------------------------------');
if (failedCount === 0) {
  console.log(`\x1b[32m✔ All ${passedCount} test suites passed cleanly!\x1b[0m`);
  process.exit(0);
} else {
  console.log(`\x1b[31m✖ ${failedCount} test suite(s) failed out of ${files.length}.\x1b[0m`);
  console.log(`Failing files: ${failedFiles.map(f => f.file).join(', ')}`);
  process.exit(1);
}
