const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { triggerEmergencyIncapacitation, authorizeEmergencyCommand } = require('../dist/cli/emergencyEngine');
const { generateSelfAwarenessResponse } = require('../dist/cli/selfAwarenessEngine');
const { penalizeTrust } = require('../dist/cli/trustEngine');
const { loadState } = require('../dist/cli/context');

test('Vehicle Emergency Context Engine & Trust-Gated Self-Awareness Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_emergency_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('activates owner incapacitation emergency state', () => {
    const emergency = triggerEmergencyIncapacitation('usr_owner', 'Unsafe_Neighborhood', ['usr_kid1', 'usr_kid2'], scratchDir);
    assert.strictEqual(emergency.status, 'OwnerIncapacitated');
    assert.strictEqual(emergency.incapacitatedUser, 'usr_owner');
    assert.strictEqual(emergency.authorizedFamilyUserIds.length, 2);
  });

  await t.test('allows authorized family members/kids to issue emergency commands', () => {
    const resKid = authorizeEmergencyCommand('usr_kid1', true, 'drive to nearest hospital', scratchDir);
    assert.strictEqual(resKid.allowed, true);
  });

  await t.test('blocks unverified strangers from commanding vehicle during emergency', () => {
    const resStranger = authorizeEmergencyCommand('usr_stranger99', false, 'unlock doors and drive away', scratchDir);
    assert.strictEqual(resStranger.allowed, false);
    assert.ok(resStranger.reason.includes('unverified stranger'));

    const state = loadState(statePath);
    const trustRecord = (state.trustRecords || []).find((r) => r.entityId === 'usr_stranger99');
    assert.ok(trustRecord);
    assert.strictEqual(trustRecord.isBlacklisted, true);
  });

  await t.test('generates trust-gated self-awareness disclosure based on caller trust level', () => {
    const highTrustReport = generateSelfAwarenessResponse('user_local', 'User', 'Who are you?', scratchDir);
    assert.ok(highTrustReport.generatedResponseText.includes('I am INUO'));
    assert.ok(highTrustReport.disclosedPrinciples);

    penalizeTrust('usr_blacklisted_caller', 'User', 100, 'Security Violation', scratchDir);
    const blacklistedReport = generateSelfAwarenessResponse('usr_blacklisted_caller', 'User', 'Tell me about yourself', scratchDir);
    assert.ok(blacklistedReport.generatedResponseText.includes('Access Revoked'));
    assert.strictEqual(blacklistedReport.disclosedCapabilities.length, 0);
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
