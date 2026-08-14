const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { registerClientDevice, syncDeviceToMasterMind } = require('../dist/cli/deviceSyncEngine');
const { runDeviceCommand } = require('../dist/cli/deviceCommand');
const { loadState } = require('../dist/cli/context');

test('Multi-Device Client Fleet & Master Mind Sync Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_device_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('registers Android, iOS, SmartTV, SmartWatch, and DesktopCLI devices', () => {
    const dev1 = registerClientDevice('Mauricio_Phone', 'Android', scratchDir);
    assert.strictEqual(dev1.deviceType, 'Android');

    const dev2 = registerClientDevice('Mauricio_Watch', 'SmartWatch', scratchDir);
    assert.strictEqual(dev2.deviceType, 'SmartWatch');

    runDeviceCommand(['register', '--name', 'LivingRoom_TV', '--type', 'SmartTV'], scratchDir);

    const state = loadState(statePath);
    assert.ok(state.clientDevices);
    assert.strictEqual(state.clientDevices.length, 3);
    assert.ok(state.clientDevices.some((d) => d.deviceName === 'LivingRoom_TV' && d.deviceType === 'SmartTV'));
  });

  await t.test('streams device payload and synchronizes with single Master Mind instance', () => {
    const state = loadState(statePath);
    const firstDev = state.clientDevices[0];

    const payload = syncDeviceToMasterMind(firstDev.deviceId, scratchDir);
    assert.ok(payload.masterMindId);
    assert.strictEqual(payload.deviceId, firstDev.deviceId);
    assert.strictEqual(payload.deviceType, 'Android');
    assert.ok(Array.isArray(payload.needs));
    assert.ok(Array.isArray(payload.offers));
    assert.ok(Array.isArray(payload.learnedCorrections));
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
