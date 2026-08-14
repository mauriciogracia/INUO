const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { executeShellLine } = require('../dist/cli/shell');
const { loadState, getProjectPaths } = require('../dist/cli/context');

test('CLI Command Priority & Command Dispatcher Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_cmd_priority_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('executes mode command with top priority without triggering LLM', async () => {
    await executeShellLine('mode letMeServeYou', scratchDir);
    const state = loadState(statePath);
    assert.equal(state.operatingMode.currentMode, 'letMeServeYou');

    await executeShellLine('mode promptMe', scratchDir);
    const updatedState = loadState(statePath);
    assert.equal(updatedState.operatingMode.currentMode, 'promptMe');
  });

  await t.test('executes mode debug command with top priority', async () => {
    await executeShellLine('mode debug 3', scratchDir);
    const state = loadState(statePath);
    assert.equal(state.operatingMode.debugLevel, 3);
  });

  await t.test('executes mode succinct command with top priority', async () => {
    await executeShellLine('mode succinct off', scratchDir);
    const state = loadState(statePath);
    assert.equal(state.operatingMode.isSuccinctMode, false);
  });

  await t.test('executes need create command with top priority', async () => {
    await executeShellLine('need create --verb Request --object FreshWater', scratchDir);
    const state = loadState(statePath);
    assert.equal(state.needs.length, 1);
    assert.equal(state.needs[0].verb, 'Request');
    assert.equal(state.needs[0].object, 'FreshWater');
  });

  await t.test('executes offer create command with top priority', async () => {
    await executeShellLine('offer create --verb Donate --object FreshWater', scratchDir);
    const state = loadState(statePath);
    assert.equal(state.offers.length, 1);
    assert.equal(state.offers[0].complementVerb, 'Donate');
    assert.equal(state.offers[0].object, 'FreshWater');
  });

  await t.test('executes status command cleanly without errors', async () => {
    await executeShellLine('status', scratchDir);
    assert.ok(true);
  });

  await t.test('executes version command cleanly without errors', async () => {
    await executeShellLine('version', scratchDir);
    assert.ok(true);
  });

  await t.test('executes whoami command cleanly without errors', async () => {
    await executeShellLine('whoami', scratchDir);
    assert.ok(true);
  });

  await t.test('executes catalog command cleanly without errors', async () => {
    await executeShellLine('catalog', scratchDir);
    assert.ok(true);
  });

  await t.test('executes help command cleanly without errors', async () => {
    await executeShellLine('help', scratchDir);
    assert.ok(true);
  });

  await t.test('executes sync command cleanly without errors', async () => {
    await executeShellLine('sync', scratchDir);
    assert.ok(true);
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
