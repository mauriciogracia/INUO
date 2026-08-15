#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const extensions = ['.ts', '.js', '.json', '.md', '.sh', '.yml', '.yaml', '.html', '.css', '.sql'];
const excludeDirs = ['node_modules', '.git', 'dist', 'graphify-out'];

let convertedCount = 0;

function convertFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('\r\n')) {
      const normalized = content.replace(/\r\n/g, '\n');
      fs.writeFileSync(filePath, normalized, 'utf8');
      convertedCount++;
    }
  } catch (err) {
    // Ignore binary or unreadable files
  }
}

function walkDir(dir) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!excludeDirs.includes(entry.name)) {
        walkDir(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext) || entry.name.startsWith('.')) {
        convertFile(fullPath);
      }
    }
  }
}

console.log('🔄 Converting CRLF line endings to LF across workspace...');
walkDir(rootDir);
console.log(`✔ Converted ${convertedCount} file(s) to LF line endings.`);
