#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

// Parse .env if present and inject into environment
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Forward CLI arguments (e.g. --code-only, --force)
const extraArgs = process.argv.slice(2);
const args = ['.', '--update', ...extraArgs];

console.log(`[update-graph] Running: graphify ${args.join(' ')}`);

const result = spawnSync('graphify', args, {
  cwd: rootDir,
  env: process.env,
  stdio: 'inherit',
  shell: true
});

if (result.error) {
  console.error('[update-graph] Failed to spawn graphify:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
