const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { runRoleCommand, runPrincipleCommand, runBehaviorCommand, runSkillCommand } = require('../dist/cli/governanceCommand');
const { loadState } = require('../dist/cli/context');

test('Behaviors, Skills, Principles & Governance Authorization Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_gov_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('initializes default state with Master Trainer baseline principles and behaviors', () => {
    const state = loadState(statePath);
    assert.strictEqual(state.currentRole, 'RegularUser');
    assert.ok(state.principles.length >= 2);
    assert.ok(state.behaviors.length >= 2);
    assert.ok(state.skills.length >= 3);
  });

  await t.test('rejects principle creation when role is RegularUser', () => {
    // Attempt adding principle while RegularUser
    runPrincipleCommand(['add', '--name', 'Regular Rule', '--statement', 'Should fail'], scratchDir);

    const state = loadState(statePath);
    const found = state.principles.find((p) => p.name === 'Regular Rule');
    assert.strictEqual(found, undefined);
  });

  await t.test('allows principle creation when role is MasterTrainer', () => {
    runRoleCommand(['MasterTrainer'], scratchDir);

    let state = loadState(statePath);
    assert.strictEqual(state.currentRole, 'MasterTrainer');

    runPrincipleCommand(['add', '--name', 'Immutable Master Directive', '--statement', 'Master Trainer unbendable rule'], scratchDir);

    state = loadState(statePath);
    const found = state.principles.find((p) => p.name === 'Immutable Master Directive');
    assert.ok(found);
    assert.strictEqual(found.createdBy, 'MasterTrainer');
    assert.strictEqual(found.isImmutable, true);
    assert.strictEqual(found.status, 'Locked');
  });

  await t.test('creates skills and groups them into a custom Behavior', () => {
    runSkillCommand(['create', '--name', 'AuditLedger', '--description', 'Audit trail verification'], scratchDir);
    runSkillCommand(['create', '--name', 'EnforcePolicy', '--description', 'Policy engine execution'], scratchDir);

    runBehaviorCommand(['create', '--name', 'GovernanceAuditBehavior', '--skills', 'AuditLedger,EnforcePolicy'], scratchDir);

    const state = loadState(statePath);
    const behavior = state.behaviors.find((b) => b.name === 'GovernanceAuditBehavior');
    assert.ok(behavior);
    assert.strictEqual(behavior.skillIds.length, 2);
    assert.deepStrictEqual(behavior.skillIds, ['AuditLedger', 'EnforcePolicy']);
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
