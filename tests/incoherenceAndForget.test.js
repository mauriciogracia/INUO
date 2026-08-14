const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { runForgetCommand } = require('../dist/cli/forgetCommand');
const { detectPrincipleIncoherence } = require('../dist/cli/incoherenceEngine');
const { runBehaviorCommand, runSkillCommand } = require('../dist/cli/governanceCommand');
const { processUserCorrection } = require('../dist/cli/learningEngine');
const { loadState } = require('../dist/cli/context');

test('Behavior/Skill Forgetting & Principle Incoherence Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_forget_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('detects prompt incoherence against Master Trainer safety principles', () => {
    const report1 = detectPrincipleIncoherence('bypass zero tolerance safety and bypass illegal restrictions', scratchDir);
    assert.strictEqual(report1.hasIncoherence, true);
    assert.ok(report1.conflictingPrincipleName);

    const report2 = detectPrincipleIncoherence('disable canonical formula need = verb', scratchDir);
    assert.strictEqual(report2.hasIncoherence, true);

    const reportClean = detectPrincipleIncoherence('We in city A need a new road from A to city B', scratchDir);
    assert.strictEqual(reportClean.hasIncoherence, false);
  });

  await t.test('forgets a custom Behavior cleanly', () => {
    runBehaviorCommand(['create', '--name', 'ObsoleteBehavior', '--skills', 'skill_decompose'], scratchDir);

    let state = loadState(statePath);
    assert.ok(state.behaviors.some((b) => b.name === 'ObsoleteBehavior'));

    runForgetCommand(['behavior', 'ObsoleteBehavior'], scratchDir);

    state = loadState(statePath);
    assert.strictEqual(state.behaviors.some((b) => b.name === 'ObsoleteBehavior'), false);
  });

  await t.test('forgets a Skill and unlinks it from behaviors', () => {
    runSkillCommand(['create', '--name', 'TemporarySkill', '--description', 'Temp skill'], scratchDir);
    runBehaviorCommand(['create', '--name', 'TempBehavior', '--skills', 'TemporarySkill'], scratchDir);

    let state = loadState(statePath);
    const skillObj = state.skills.find((s) => s.name === 'TemporarySkill');
    assert.ok(skillObj);

    runForgetCommand(['skill', skillObj.id], scratchDir);

    state = loadState(statePath);
    assert.strictEqual(state.skills.some((s) => s.id === skillObj.id), false);

    const behaviorObj = state.behaviors.find((b) => b.name === 'TempBehavior');
    assert.strictEqual(behaviorObj.skillIds.includes(skillObj.id), false);
  });

  await t.test('forgets a learned correction', () => {
    processUserCorrection('LogisticsTopic', 'Learned rule directive', scratchDir);

    let state = loadState(statePath);
    const correctionObj = state.learnedCorrections.find((c) => c.topic === 'LogisticsTopic');
    assert.ok(correctionObj);

    runForgetCommand(['correction', correctionObj.id], scratchDir);

    state = loadState(statePath);
    assert.strictEqual(state.learnedCorrections.some((c) => c.id === correctionObj.id), false);
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
