import { getProjectPaths, loadState, saveState } from './context';
import { ClientDeviceConfig } from '../interfaces/ClientDeviceConfig';
import { MasterMindSyncPayload } from '../interfaces/MasterMindSyncPayload';
import { DeviceType } from '../types/DeviceType';
import { getTrustRecord } from './trustEngine';

export function registerClientDevice(
  deviceName: string,
  deviceType: DeviceType = 'DesktopCLI',
  rootDir: string = process.cwd()
): ClientDeviceConfig {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  if (!state.clientDevices) state.clientDevices = [];

  const deviceId = `dev_${deviceType.toLowerCase()}_${Date.now()}`;
  const trust = getTrustRecord(deviceId, 'User', rootDir);

  const device: ClientDeviceConfig = {
    deviceId,
    deviceName,
    deviceType,
    trustScore: trust.trustScore,
    trustLevel: trust.trustLevel,
    lastActiveAt: new Date().toISOString(),
    registeredAt: new Date().toISOString(),
  };

  state.clientDevices.push(device);
  saveState(paths.statePath, state);
  return device;
}

export function syncDeviceToMasterMind(
  deviceId?: string,
  rootDir: string = process.cwd()
): MasterMindSyncPayload {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const masterMindId = state.masterMindId || 'master_mind_primary';
  const devices = state.clientDevices || [];

  let targetDevice = devices.find((d) => d.deviceId === deviceId || d.deviceName === deviceId);
  if (!targetDevice) {
    targetDevice = devices[0] || registerClientDevice('Local_Desktop_CLI', 'DesktopCLI', rootDir);
  }

  targetDevice.lastActiveAt = new Date().toISOString();
  saveState(paths.statePath, state);

  const payload: MasterMindSyncPayload = {
    masterMindId,
    deviceId: targetDevice.deviceId,
    deviceType: targetDevice.deviceType,
    needs: state.needs || [],
    offers: state.offers || [],
    learnedCorrections: state.learnedCorrections || [],
    syncedAt: new Date().toISOString(),
  };

  return payload;
}
