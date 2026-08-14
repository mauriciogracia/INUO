const test = require('node:test');

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { runNeedCommand } = require('../dist/cli/needCommand');
const { runDetailCommand, runAnswerCommand } = require('../dist/cli/detailCommand');
const { loadState } = require('../dist/cli/context');

test('Detailing & Recursive Planning Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_detail_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('creates parent need and sub-needs with hierarchical visual codes (1, 1.1, 1.2)', () => {
    // Create Root Macro Need
    runNeedCommand(['create', '--verb', 'Construct', '--object', 'New City Road'], scratchDir);

    let state = loadState(statePath);
    assert.strictEqual(state.needs.length, 1);
    assert.strictEqual(state.needs[0].hierarchicalId, '1');
    assert.strictEqual(state.needs[0].isAtomic, true);

    const rootId = state.needs[0].id;

    // Create Sub-Needs under Root Need
    runNeedCommand(['create', '--verb', 'Consult', '--object', 'Geotechnical Survey', '--parent', rootId], scratchDir);
    runNeedCommand(['create', '--verb', 'Deliver', '--object', 'Asphalt Paving', '--parent', rootId], scratchDir);

    state = loadState(statePath);
    assert.strictEqual(state.needs.length, 3);

    const parent = state.needs.find((n) => n.id === rootId);
    assert.strictEqual(parent.isAtomic, false);
    assert.strictEqual(parent.status, 'Blocked');

    const child1 = state.needs.find((n) => n.object === 'Geotechnical Survey');
    const child2 = state.needs.find((n) => n.object === 'Asphalt Paving');

    assert.strictEqual(child1.hierarchicalId, '1.1');
    assert.strictEqual(child2.hierarchicalId, '1.2');
    assert.strictEqual(child1.parentNeedId, rootId);
  });

  await t.test('records user details as Knowledge Provider using answer command', () => {
    const state = loadState(statePath);
    const rootNeed = state.needs.find((n) => !n.parentNeedId);

    runAnswerCommand([rootNeed.hierarchicalId, 'Width will be 4 lanes with reinforced foundation'], scratchDir);

    const updatedState = loadState(statePath);
    const updatedRoot = updatedState.needs.find((n) => n.id === rootNeed.id);

    assert.ok(updatedRoot.knowledgeNotes);
    assert.strictEqual(updatedRoot.knowledgeNotes.length, 1);
    assert.strictEqual(updatedRoot.knowledgeNotes[0], 'Width will be 4 lanes with reinforced foundation');
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
