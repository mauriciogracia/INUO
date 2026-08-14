import { getProjectPaths, loadState } from './context';
import { registerClientDevice, syncDeviceToMasterMind } from './deviceSyncEngine';
import { DeviceType } from '../types/DeviceType';

export function runDeviceCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0]?.toLowerCase() || 'list';
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (sub === 'list') {
    console.log('\x1b[36m%s\x1b[0m', `=== Registered Client Devices Feeding Master Mind [${state.masterMindId || 'master_mind_primary'}] ===\n`);
    const devices = state.clientDevices || [];

    if (devices.length === 0) {
      console.log('No client devices registered yet. Register one using "device register --type <Android|iOS|SmartTV|SmartWatch|DesktopCLI> --name <Name>"');
      return;
    }

    console.log(`\x1b[1m${'DEVICE ID'.padEnd(25)} | ${'DEVICE NAME'.padEnd(20)} | TYPE | TRUST SCORE | LAST ACTIVE\x1b[0m`);
    console.log(''.padEnd(90, '-'));

    devices.forEach((d) => {
      console.log(
        `${d.deviceId.padEnd(25)} | \x1b[1m${d.deviceName.padEnd(20)}\x1b[0m | ${d.deviceType.padEnd(10)} | \x1b[33m${d.trustScore}/100\x1b[0m | ${d.lastActiveAt}`
      );
    });
    return;
  }

  if (sub === 'register' || sub === 'add') {
    let name = '';
    let typeInput: DeviceType = 'DesktopCLI';

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--name' && args[i + 1]) name = args[i + 1];
      if (args[i] === '--type' && args[i + 1]) {
        const t = args[i + 1].toLowerCase();
        if (t === 'android') typeInput = 'Android';
        if (t === 'ios' || t === 'iphone') typeInput = 'iOS';
        if (t === 'smarttv' || t === 'tv') typeInput = 'SmartTV';
        if (t === 'smartwatch' || t === 'watch') typeInput = 'SmartWatch';
        if (t === 'desktopcli' || t === 'cli') typeInput = 'DesktopCLI';
      }
    }

    if (!name && args[1] && !args[1].startsWith('-')) name = args[1];

    if (!name) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: device register --name <DeviceName> [--type Android|iOS|SmartTV|SmartWatch|DesktopCLI]');
      return;
    }

    const device = registerClientDevice(name, typeInput, rootDir);
    console.log(
      '\x1b[32m%s\x1b[0m',
      `✔ Registered Client Device: "${device.deviceName}" [Type: ${device.deviceType}, ID: ${device.deviceId}] -> Connected to Master Mind!`
    );
    return;
  }

  if (sub === 'sync') {
    const deviceId = args[1];
    const payload = syncDeviceToMasterMind(deviceId, rootDir);
    console.log(
      `\x1b[32m✔ Streamed Device Sync Payload to Master Mind [${payload.masterMindId}]:\x1b[0m Device: ${payload.deviceId} (${payload.deviceType}) | ${payload.needs.length} Needs, ${payload.offers.length} Offers, ${payload.learnedCorrections.length} Learned Rules`
    );
    return;
  }

  console.log('Unknown subcommand for device. Supported: "device list", "device register --name <N> --type <T>", "device sync"');
}
