const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { runOfferCommand } = require('../dist/cli/offerCommand');
const { loadState } = require('../dist/cli/context');

test('Offer Model & Command Unit Tests', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp_offer_'));
  const statePath = path.join(tmpDir, '.inuo-state.json');

  await t.test('creates an Offer with formula OFFER = (COMP_VERB) + (OBJECT)', () => {
    runOfferCommand(['create', '--verb', 'Advise', '--object', 'Geotechnical survey'], tmpDir);

    const state = loadState(statePath);
    assert.equal(state.offers.length, 1);
    const offer = state.offers[0];

    assert.equal(offer.complementVerb, 'Advise');
    assert.equal(offer.object, 'Geotechnical survey');
    assert.equal(offer.status, 'Available');
    assert.equal(offer.modelType, 'Transactional');
  });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
