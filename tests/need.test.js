const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { runNeedCommand } = require('../dist/cli/needCommand');
const { loadState } = require('../dist/cli/context');

test('Need Model & Command Unit Tests', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp_need_'));
  const statePath = path.join(tmpDir, '.inuo-state.json');

  await t.test('creates a Need with canonical formula NEED = (VERB) + (OBJECT)', () => {
    runNeedCommand(['create', '--verb', 'Consult', '--object', 'Geotechnical survey'], tmpDir);

    const state = loadState(statePath);
    assert.equal(state.needs.length, 1);
    const need = state.needs[0];

    assert.equal(need.verb, 'Consult');
    assert.equal(need.object, 'Geotechnical survey');
    assert.equal(need.complementVerb, 'Advise');
    assert.equal(need.status, 'Open');
    assert.equal(need.isAtomic, true);
    assert.equal(need.modelType, 'Transactional');
  });

  await t.test('lists created needs cleanly', () => {
    runNeedCommand(['list'], tmpDir);
    const state = loadState(statePath);
    assert.equal(state.needs.length, 1);
  });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
