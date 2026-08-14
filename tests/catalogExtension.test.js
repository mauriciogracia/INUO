const test = require('node:test');

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { runCatalog, getComplementForVerb, addCustomVerbPairing } = require('../dist/cli/catalogCommand');

test('Dynamic Catalog Verb Extension Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_catalog_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('retrieves built-in verb complement', () => {
    const comp = getComplementForVerb('Request', scratchDir);
    assert.strictEqual(comp, 'Donate');
  });

  await t.test('adds custom dynamic verb and complement pairing', () => {
    addCustomVerbPairing('Invent', 'Manufacture', scratchDir);

    const comp = getComplementForVerb('Invent', scratchDir);
    assert.strictEqual(comp, 'Manufacture');
  });

  await t.test('runs catalog command with add subcommand', () => {
    runCatalog(['add', '--verb', 'Fabricate', '--complement', 'Assemble'], scratchDir);

    const comp = getComplementForVerb('Fabricate', scratchDir);
    assert.strictEqual(comp, 'Assemble');
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
