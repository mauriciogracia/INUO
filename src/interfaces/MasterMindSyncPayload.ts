import { DeviceType } from '../types/DeviceType';
import { Need } from './Need';
import { Offer } from './Offer';
import { LearnedCorrection } from './LearnedCorrection';

/**
 * Sync payload streamed from client devices to feed the central Master Mind.
 */
export interface MasterMindSyncPayload {
  /** Target Master Mind instance ID */
  masterMindId: string;

  /** Source client device ID */
  deviceId: string;

  /** Source device type */
  deviceType: DeviceType;

  /** Needs originated from this device */
  needs: Need[];

  /** Offers originated from this device */
  offers: Offer[];

  /** Learned corrections / rules contributed by this device */
  learnedCorrections: LearnedCorrection[];

  /** ISO Timestamp of sync execution */
  syncedAt: string;
}
