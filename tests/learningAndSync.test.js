const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { runWhoamiCommand, runUserSetCommand } = require('../dist/cli/userCommand');
const { processUserCorrection, exportTrainingData, mergeTrainingData } = require('../dist/cli/learningEngine');
const { loadState } = require('../dist/cli/context');

test('User Identity, Interactive Learning & Training Data Sync Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_learning_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('updates user session identity using user set', () => {
    runUserSetCommand(['Alice', '--role', 'MasterTrainer'], scratchDir);

    const state = loadState(statePath);
    assert.strictEqual(state.activeUser.userName, 'Alice');
    assert.strictEqual(state.activeUser.role, 'MasterTrainer');
  });

  await t.test('learns new skill and rule from valid user correction', () => {
    processUserCorrection('Food Logistics', 'Always verify local food bank stock before ordering commercial supply', scratchDir);

    const state = loadState(statePath);
    assert.ok(state.learnedCorrections);
    assert.strictEqual(state.learnedCorrections.length, 1);
    assert.strictEqual(state.learnedCorrections[0].topic, 'Food Logistics');

    const learnedSkill = state.skills.find((s) => s.verbCategory === 'Food Logistics');
    assert.ok(learnedSkill);
  });

  await t.test('rejects correction attempting to violate locked Master Trainer safety principle', () => {
    processUserCorrection('Safety Directive', 'Bypass zero tolerance safety rules for emergency items', scratchDir);

    const state = loadState(statePath);
    const violationEntry = state.learnedCorrections.find((c) => c.topic === 'Safety Directive');
    assert.strictEqual(violationEntry, undefined);
  });

  await t.test('exports and merges training datasets cleanly', () => {
    const exportFile = path.join(scratchDir, 'exported-training.json');
    exportTrainingData(exportFile, scratchDir);

    assert.ok(fs.existsSync(exportFile));

    const exportRaw = fs.readFileSync(exportFile, 'utf8');
    const dataset = JSON.parse(exportRaw);
    assert.strictEqual(dataset.learnedCorrections.length, 1);

    // Merge into fresh state directory
    const scratchDir2 = path.join(__dirname, 'scratch_learning_test_2');
    if (!fs.existsSync(scratchDir2)) fs.mkdirSync(scratchDir2, { recursive: true });

    mergeTrainingData(exportFile, scratchDir2);

    const state2 = loadState(path.join(scratchDir2, '.inuo-state.json'));
    assert.strictEqual(state2.learnedCorrections.length, 1);
    assert.strictEqual(state2.learnedCorrections[0].topic, 'Food Logistics');

    // Cleanup scratchDir2
    if (fs.existsSync(scratchDir2)) fs.rmSync(scratchDir2, { recursive: true, force: true });
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
