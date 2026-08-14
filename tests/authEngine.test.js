const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  authenticateMasterPassphrase,
  authenticateMemberPIN,
  authenticateBiometricVoice,
  authenticateLiveVideo,
  authenticateDeviceToken,
  signOutActiveSession,
} = require('../dist/cli/authEngine');
const { addTrustedMember } = require('../dist/cli/trustedMemberEngine');
const { loadState } = require('../dist/cli/context');

test('Multi-Modal Sign-In & Authentication Engine Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_auth_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('authenticates Master Trainer session via Master Passphrase', () => {
    const res = authenticateMasterPassphrase('master123', scratchDir);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.authMethod, 'MasterPassphrase');

    const state = loadState(statePath);
    assert.strictEqual(state.currentRole, 'MasterTrainer');
    assert.strictEqual(state.activeUser.userName, 'MasterTrainer');
    assert.strictEqual(state.activeUser.trustScore, 100);
  });

  await t.test('authenticates family member via PIN', () => {
    addTrustedMember('Kid_Lucas', 'Family', [], scratchDir);

    const res = authenticateMemberPIN('Kid_Lucas', '1234', scratchDir);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.authMethod, 'MemberPIN');

    const state = loadState(statePath);
    assert.strictEqual(state.activeUser.userName, 'Kid_Lucas');
    assert.strictEqual(state.activeUser.isFamilyMember, true);
  });

  await t.test('authenticates session via Biometric Voiceprint and Live Video Feed', () => {
    const resVoice = authenticateBiometricVoice('Doctor_Elena', 'sample_voice_01', scratchDir);
    assert.strictEqual(resVoice.success, true);
    assert.strictEqual(resVoice.authMethod, 'BiometricVoiceprint');

    const resVideo = authenticateLiveVideo('Daughter_Sofia', 'camera_feed_01', scratchDir);
    assert.strictEqual(resVideo.success, true);
    assert.strictEqual(resVideo.authMethod, 'LiveVideoRecognition');
  });

  await t.test('authenticates session via Device Token and signs out cleanly', () => {
    const resDev = authenticateDeviceToken('smart_watch_sofia_01', 'tok_watch', scratchDir);
    assert.strictEqual(resDev.success, true);
    assert.strictEqual(resDev.authMethod, 'TrustedDeviceToken');

    signOutActiveSession(scratchDir);

    const state = loadState(statePath);
    assert.strictEqual(state.currentRole, 'RegularUser');
    assert.strictEqual(state.activeUser.userName, 'Default User');
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
