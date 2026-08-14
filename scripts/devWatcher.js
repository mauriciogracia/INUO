const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

let appProcess = null;
let isBuilding = false;

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

function getSystemVersion() {
  try {
    const manifestPath = path.join(rootDir, 'inuo-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.SPEC_VERSION) return manifest.SPEC_VERSION;
    }
  } catch {}
  return '00.02.95';
}

function startApp() {
  if (appProcess) {
    try {
      appProcess.kill();
    } catch {}
  }
  const version = getSystemVersion();
  console.log('\x1b[36m%s\x1b[0m', `\n⚡ [INUO Live-Reload] Reloading latest INUO version (v${version})...\n`);
  appProcess = spawn('node', ['./bin/inuo.js'], { cwd: rootDir, stdio: 'inherit', shell: true });
}

let debounceTimer = null;

function triggerRebuild() {
  if (isBuilding) return;
  isBuilding = true;

  const version = getSystemVersion();
  console.log('\x1b[33m%s\x1b[0m', `\n🔄 [INUO Dev Server] Source change detected! Recompiling & reloading INUO (v${version})...`);
  const build = spawn('tsc', [], { cwd: rootDir, stdio: 'ignore', shell: true });

  build.on('close', (code) => {
    isBuilding = false;
    if (code === 0) {
      startApp();
    } else {
      console.log('\x1b[31m%s\x1b[0m', '❌ [INUO Dev Server] TypeScript Compilation Error! Fix error to trigger auto-reload...');
    }
  });
}

function watchDirectory(dir) {
  try {
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (filename && (filename.endsWith('.ts') || filename.endsWith('.json'))) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          triggerRebuild();
        }, 150);
      }
    });
  } catch (err) {
    console.log(`[Watch Error] ${err.message}`);
  }
}

const currentVersion = getSystemVersion();
console.log('\x1b[32m%s\x1b[0m', `🚀 [INUO Dev Server] Live-Reload Active for v${currentVersion} (watching src/**/*.ts)...`);
console.log('\x1b[90m%s\x1b[0m', 'Any code change will automatically recompile and reload the latest INUO version.\n');

// Initial build and launch
const initialBuild = spawn('tsc', [], { cwd: rootDir, stdio: 'inherit', shell: true });
initialBuild.on('close', (code) => {
  if (code === 0) {
    startApp();
    watchDirectory(srcDir);
  }
});
