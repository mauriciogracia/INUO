const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  pushMasterMindSnapshot,
  getHistorySnapshots,
  rollbackMasterMindState,
} = require('../dist/cli/masterMindHistoryEngine');
const { runNeedCommand } = require('../dist/cli/needCommand');
const { loadState } = require('../dist/cli/context');

test('3-Version Master Mind Snapshot History Ring Buffer Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_mm_history_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  const snapPath = path.join(scratchDir, '.inuo-snapshots.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(snapPath)) fs.unlinkSync(snapPath);

  await t.test('maintains sliding ring buffer of max 3 Master Mind version snapshots', () => {
    runNeedCommand(['create', '--verb', 'Request', '--object', 'Water Supply'], scratchDir);
    pushMasterMindSnapshot('Checkpoint 1', scratchDir);

    runNeedCommand(['create', '--verb', 'Consult', '--object', 'Engine Repair'], scratchDir);
    pushMasterMindSnapshot('Checkpoint 2', scratchDir);

    runNeedCommand(['create', '--verb', 'Donate', '--object', 'Blankets'], scratchDir);
    pushMasterMindSnapshot('Checkpoint 3', scratchDir);

    runNeedCommand(['create', '--verb', 'Deliver', '--object', 'Medical Kit'], scratchDir);
    pushMasterMindSnapshot('Checkpoint 4', scratchDir);

    const snapshots = getHistorySnapshots(scratchDir);
    assert.strictEqual(snapshots.length, 3);
    assert.strictEqual(snapshots[0].summary, 'Checkpoint 4');
    assert.strictEqual(snapshots[1].summary, 'Checkpoint 3');
    assert.strictEqual(snapshots[2].summary, 'Checkpoint 2');
  });

  await t.test('rolls back Master Mind state 1 step cleanly while preserving principles', () => {
    const res = rollbackMasterMindState(1, scratchDir);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.restoredSnapshot.summary, 'Checkpoint 3');

    const state = loadState(statePath);
    assert.ok(state.principles);
    assert.strictEqual(state.principles.length > 0, true);
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(snapPath)) fs.unlinkSync(snapPath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
