const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { storeLocalBiometricCredential, verifyLocalBiometricCredential } = require('../dist/cli/localAuthVaultEngine');
const { exportTrainingData } = require('../dist/cli/learningEngine');
const { loadState } = require('../dist/cli/context');

test('Localized Master Mind Biometric Vault & Zero-Global-Provider Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_local_vault_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('stores and verifies PIN, Voice, and Video biometric credentials locally in Master Mind state', () => {
    storeLocalBiometricCredential('mem_sofia_01', 'Sofia', 'PIN', '4321', scratchDir);
    storeLocalBiometricCredential('mem_sofia_01', 'Sofia', 'Voice', [0.12, 0.45, 0.88, 0.92], scratchDir);
    storeLocalBiometricCredential('mem_sofia_01', 'Sofia', 'Video', [0.99, 0.22, 0.33, 0.11, 0.55], scratchDir);

    assert.strictEqual(verifyLocalBiometricCredential('Sofia', 'PIN', '4321', scratchDir), true);
    assert.strictEqual(verifyLocalBiometricCredential('Sofia', 'PIN', '9999', scratchDir), false);

    assert.strictEqual(verifyLocalBiometricCredential('Sofia', 'Voice', [0.1, 0.2, 0.3, 0.4], scratchDir), true);
    assert.strictEqual(verifyLocalBiometricCredential('Sofia', 'Video', [0.1, 0.2, 0.3, 0.4, 0.5], scratchDir), true);
  });

  await t.test('guarantees zero biometric leaks during training dataset export', () => {
    const exportFile = path.join(scratchDir, 'exported_data.json');
    exportTrainingData(exportFile, scratchDir);

    const raw = fs.readFileSync(exportFile, 'utf8');
    const dataset = JSON.parse(raw);

    assert.strictEqual(dataset.localAuthVault, undefined);
    assert.strictEqual(dataset.biometricVault, undefined);
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
