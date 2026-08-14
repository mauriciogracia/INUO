const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { initiateProgressiveMasterMindSync, authorizeProgressiveSync } = require('../dist/cli/progressiveSyncEngine');
const { loadState, getProjectPaths } = require('../dist/cli/context');

test('Progressive Master Mind Sync & 15-Minute Download Gate Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_progsync_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const paths = getProjectPaths(scratchDir);
  if (fs.existsSync(paths.statePath)) fs.unlinkSync(paths.statePath);

  await t.test('automatically syncs in background when download time is <= 15 minutes', () => {
    const sync = initiateProgressiveMasterMindSync(50 * 1024 * 1024, 50, scratchDir);

    assert.strictEqual(sync.essentialSkillsDownloaded, true);
    assert.strictEqual(sync.requiresUserAuthorization, false);
    assert.strictEqual(sync.status, 'Syncing');
  });

  await t.test('triggers interactive user authorization gate when download time > 15 minutes', () => {
    const sync = initiateProgressiveMasterMindSync(2000 * 1024 * 1024, 2, scratchDir);

    assert.strictEqual(sync.essentialSkillsDownloaded, true);
    assert.strictEqual(sync.requiresUserAuthorization, true);
    assert.strictEqual(sync.status, 'PendingAuthorization');

    const state = loadState(paths.statePath);
    assert.strictEqual(state.interactiveQuestions.length, 1);
    assert.match(state.interactiveQuestions[0].questionTitle, /Master Mind sync payload size is 2000MB/);
  });

  await t.test('resumes background sync upon user authorization', () => {
    const state = loadState(paths.statePath);
    const pendingSync = state.progressiveSyncs.find((s) => s.status === 'PendingAuthorization');

    const updated = authorizeProgressiveSync(pendingSync.syncId, true, scratchDir);
    assert.strictEqual(updated.isUserAuthorized, true);
    assert.strictEqual(updated.status, 'Syncing');
  });

  // Cleanup
  if (fs.existsSync(paths.statePath)) fs.unlinkSync(paths.statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
