const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { runNeedCommand } = require('../dist/cli/needCommand');
const { runOfferCommand } = require('../dist/cli/offerCommand');
const { runMatchCommand } = require('../dist/cli/matchCommand');
const { loadState } = require('../dist/cli/context');

test('Interaction Engine Matching Unit Tests', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp_match_'));
  const statePath = path.join(tmpDir, '.inuo-state.json');

  await t.test('programmatically validates match between Need and Offer', () => {
    // 1. Create Need: Request Food packet
    runNeedCommand(['create', '--verb', 'Request', '--object', 'Food packet'], tmpDir);

    // 2. Create Offer: Donate Food packet
    runOfferCommand(['create', '--verb', 'Donate', '--object', 'Food packet'], tmpDir);

    // 3. Run Matching Engine
    runMatchCommand(tmpDir);

    const state = loadState(statePath);
    assert.equal(state.matches.length, 1);
    const match = state.matches[0];

    assert.equal(match.status, 'Validated');
    assert.equal(match.verb, 'Request');
    assert.equal(match.complementVerb, 'Donate');

    // Verify status updates on Need and Offer
    assert.equal(state.needs[0].status, 'Matched');
    assert.equal(state.offers[0].status, 'Matched');
  });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
