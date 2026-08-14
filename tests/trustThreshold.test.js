const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createThresholdGate, evaluateThresholdAccess } = require('../dist/cli/trustThresholdEngine');
const { addTrustedMember } = require('../dist/cli/trustedMemberEngine');
const { penalizeTrust } = require('../dist/cli/trustEngine');
const { loadState } = require('../dist/cli/context');

test('Multi-Party Threshold Trust Consensus Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_threshold_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('creates threshold protection gate for Car_Key_Location requiring 150 trust pts', () => {
    const gate = createThresholdGate('Car_Key_Location', 150, 'Glove Compartment Lockbox Key', scratchDir);
    assert.strictEqual(gate.assetName, 'Car_Key_Location');
    assert.strictEqual(gate.requiredTrustScore, 150);

    const state = loadState(statePath);
    assert.strictEqual(state.thresholdGates.length, 1);
  });

  await t.test('denies access to single member (Score: 100 < 150 required)', () => {
    addTrustedMember('Kid_Sofia', 'Family', [], scratchDir);

    const resSingle = evaluateThresholdAccess('Car_Key_Location', ['Kid_Sofia'], scratchDir);
    assert.strictEqual(resSingle.granted, false);
    assert.strictEqual(resSingle.combinedScore, 100);
    assert.strictEqual(resSingle.requiredScore, 150);
  });

  await t.test('grants access when multi-member consensus sum meets threshold (100 + 100 = 200 >= 150)', () => {
    addTrustedMember('Doctor_Alex', 'TrustedFriend', [], scratchDir);

    const resMulti = evaluateThresholdAccess('Car_Key_Location', ['Kid_Sofia', 'Doctor_Alex'], scratchDir);
    assert.strictEqual(resMulti.granted, true);
    assert.strictEqual(resMulti.combinedScore, 200);
    assert.strictEqual(resMulti.protectedData, 'Glove Compartment Lockbox Key');
  });

  await t.test('blocks threshold unlock if any co-signing member is blacklisted', () => {
    const badMember = addTrustedMember('Suspicious_Relative', 'Family', [], scratchDir);
    penalizeTrust(badMember.memberId, 'User', 80, 'Testing blacklist', scratchDir); // Score drops to 20 (Blacklisted)

    const resBlock = evaluateThresholdAccess('Car_Key_Location', ['Kid_Sofia', badMember.memberId], scratchDir);
    assert.strictEqual(resBlock.granted, false);
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
