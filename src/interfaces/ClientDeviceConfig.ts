import { DeviceType } from '../types/DeviceType';
import { TrustLevel } from '../types/TrustLevel';

/**
 * Configuration and identity of a device client feeding the central Master Mind.
 */
export interface ClientDeviceConfig {
  /** Unique client device ID */
  deviceId: string;

  /** Display name of the device (e.g. 'Mauricio_Pixel7', 'LivingRoom_SmartTV') */
  deviceName: string;

  /** Type of client device ('Android' | 'iOS' | 'SmartTV' | 'SmartWatch' | 'DesktopCLI') */
  deviceType: DeviceType;

  /** Dynamic trust score assigned to this client device (0 to 100) */
  trustScore: number;

  /** Dynamic trust level */
  trustLevel: TrustLevel;

  /** ISO Timestamp when device was last active */
  lastActiveAt: string;

  /** ISO Timestamp when device was registered */
  registeredAt: string;
}
