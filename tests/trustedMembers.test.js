const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { addTrustedMember, bindDeviceToMember, isTrustedFamilyOrFriend } = require('../dist/cli/trustedMemberEngine');
const { triggerEmergencyIncapacitation, authorizeEmergencyCommand } = require('../dist/cli/emergencyEngine');
const { runMemberCommand } = require('../dist/cli/memberCommand');
const { loadState } = require('../dist/cli/context');

test('Master Mind Trusted Members Network & Emergency Authorization Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_trusted_members_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('registers family members and trusted friends in Master Mind network', () => {
    const mem1 = addTrustedMember('Kid_Sofia', 'Family', ['watch_sofia_01'], scratchDir);
    assert.strictEqual(mem1.memberName, 'Kid_Sofia');
    assert.strictEqual(mem1.relationshipType, 'Family');

    runMemberCommand(['add', '--name', 'Doctor_Alex', '--relation', 'TrustedFriend', '--devices', 'phone_alex_99'], scratchDir);

    const state = loadState(statePath);
    assert.strictEqual(state.trustedMembers.length, 2);
    assert.ok(state.trustedMembers.some((m) => m.memberName === 'Doctor_Alex' && m.relationshipType === 'TrustedFriend'));
  });

  await t.test('binds multi-modal devices to trusted members and verifies access', () => {
    bindDeviceToMember('Kid_Sofia', 'tablet_sofia_02', scratchDir);

    const state = loadState(statePath);
    const sofia = state.trustedMembers.find((m) => m.memberName === 'Kid_Sofia');
    assert.ok(sofia.trustedDeviceIds.includes('tablet_sofia_02'));

    assert.strictEqual(isTrustedFamilyOrFriend('watch_sofia_01', scratchDir), true);
    assert.strictEqual(isTrustedFamilyOrFriend('tablet_sofia_02', scratchDir), true);
    assert.strictEqual(isTrustedFamilyOrFriend('stranger_unauthorized_device', scratchDir), false);
  });

  await t.test('authorizes emergency commands from devices bound to trusted members while blocking strangers', () => {
    triggerEmergencyIncapacitation('Mauricio_Owner', 'Highway_Zone', [], scratchDir);

    const resSofia = authorizeEmergencyCommand('watch_sofia_01', false, 'lock doors and call 911', scratchDir);
    assert.strictEqual(resSofia.allowed, true);

    const resStranger = authorizeEmergencyCommand('stranger_unauthorized_device', false, 'unlock doors', scratchDir);
    assert.strictEqual(resStranger.allowed, false);
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
