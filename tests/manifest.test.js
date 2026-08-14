const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { runBootstrap } = require('../dist/cli/bootstrapCommand');
const { runTest } = require('../dist/cli/testCommand');
const { runRollback } = require('../dist/cli/rollbackCommand');
const { loadManifest } = require('../dist/cli/context');

test('Manifest Sync & Operational Lifecycle Unit Tests', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp_manifest_'));
  const manifestPath = path.join(tmpDir, 'inuo-manifest.json');
  const specPath = path.join(tmpDir, 'INUO_SPEC.md');

  await t.test('bootstraps INUO_SPEC.md and inuo-manifest.json v00.95.02', () => {
    runBootstrap(tmpDir);

    assert.equal(fs.existsSync(specPath), true);
    assert.equal(fs.existsSync(manifestPath), true);

    const manifest = loadManifest(manifestPath);
    assert.equal(manifest.SPEC_VERSION, '00.95.02');
    assert.equal(manifest.cliVersion, '00.95.02');
  });

  await t.test('verifies SPEC_VERSION matching', () => {
    runTest('00.95.02', tmpDir);
  });

  await t.test('executes rollback sequence to previous version snapshot', () => {
    runRollback('0.0.9', tmpDir);

    const manifest = loadManifest(manifestPath);
    assert.equal(manifest.SPEC_VERSION, '0.0.9');
  });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
