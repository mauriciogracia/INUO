#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function printHelp() {
  console.log(`
Usage: listChildren [options] [targetPath]

Arguments:
  targetPath               Directory path to list (default: current directory)

Options:
  -r, --recurse, -Recurse      Recursively scan subdirectories
  -f, --filter, -Filter <glob> Filter by pattern (e.g. "*.md", "*.ts", "Need*")
  -e, --exclude <pattern>      Exclude paths (default: node_modules,.git,dist)
  --file, -File                List files only
  --dir, -Directory            List directories only
  --full                       Print absolute paths instead of relative
  --stats, -s                  Show file size and last modified date
  --all                        Do not exclude default ignored folders
  -h, --help                   Show this help message

Examples:
  ./listChildren.sh -r -f "*.md"
  ./listChildren.sh -r -f "*.ts" src
  ./listChildren.sh --dir
`);
}

function matchPattern(name, pattern) {
  if (!pattern || pattern === '*' || pattern === '*.*') return true;
  const regexStr = '^' + pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.') + '$';
  return new RegExp(regexStr, 'i').test(name);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    targetPath: '.',
    recurse: false,
    filter: '*',
    excludes: ['node_modules', '.git', 'dist'],
    filesOnly: false,
    dirsOnly: false,
    fullPath: false,
    showStats: false,
    includeAll: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help' || arg === '-Help') {
      printHelp();
      process.exit(0);
    } else if (arg === '-r' || arg === '--recurse' || arg === '-Recurse') {
      options.recurse = true;
    } else if (arg === '-f' || arg === '--filter' || arg === '-Filter') {
      options.filter = args[++i] || '*';
    } else if (arg === '-e' || arg === '--exclude' || arg === '-Exclude') {
      const customExcludes = (args[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
      options.excludes.push(...customExcludes);
    } else if (arg === '--file' || arg === '-File' || arg === '--files-only') {
      options.filesOnly = true;
    } else if (arg === '--dir' || arg === '-Directory' || arg === '--dirs-only') {
      options.dirsOnly = true;
    } else if (arg === '--full' || arg === '-Full') {
      options.fullPath = true;
    } else if (arg === '--stats' || arg === '-s') {
      options.showStats = true;
    } else if (arg === '--all') {
      options.includeAll = true;
    } else if (!arg.startsWith('-')) {
      options.targetPath = arg;
    }
  }

  if (options.includeAll) {
    options.excludes = [];
  }

  return options;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function scanDir(dir, options, baseDir = dir) {
  const results = [];

  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    console.error(`[listChildren] Cannot read directory ${dir}: ${err.message}`);
    return results;
  }

  for (const entry of entries) {
    const name = entry.name;
    const fullPath = path.resolve(dir, name);
    const relPath = path.relative(baseDir, fullPath);

    if (options.excludes.some((ex) => name === ex || relPath.split(path.sep).includes(ex))) {
      continue;
    }

    const isDir = entry.isDirectory();
    const isFile = entry.isFile();

    let matchesFilter = matchPattern(name, options.filter);

    if (isDir) {
      if (!options.filesOnly && matchesFilter) {
        results.push({ fullPath, relPath, isDir: true, name });
      }
      if (options.recurse) {
        results.push(...scanDir(fullPath, options, baseDir));
      }
    } else if (isFile) {
      if (!options.dirsOnly && matchesFilter) {
        let size = 0;
        let mtime = '';
        if (options.showStats) {
          try {
            const stat = fs.statSync(fullPath);
            size = stat.size;
            mtime = stat.mtime.toISOString().split('T')[0];
          } catch {}
        }
        results.push({ fullPath, relPath, isDir: false, name, size, mtime });
      }
    }
  }

  return results;
}

function main() {
  const options = parseArgs();
  const targetDir = path.resolve(process.cwd(), options.targetPath);

  if (!fs.existsSync(targetDir)) {
    console.error(`[listChildren] Path does not exist: ${options.targetPath}`);
    process.exit(1);
  }

  const stat = fs.statSync(targetDir);
  if (!stat.isDirectory()) {
    console.log(options.fullPath ? targetDir : path.relative(process.cwd(), targetDir));
    return;
  }

  const items = scanDir(targetDir, options, targetDir);

  for (const item of items) {
    const displayPath = options.fullPath ? item.fullPath : item.relPath;
    if (options.showStats && !item.isDir) {
      const paddedSize = formatBytes(item.size).padStart(9);
      console.log(`${paddedSize}  ${item.mtime}  ${displayPath}`);
    } else if (item.isDir) {
      console.log(`${displayPath}/`);
    } else {
      console.log(displayPath);
    }
  }
}

main();
