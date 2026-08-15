import { ConnectivityState } from '../types/ConnectivityState';
import { StorageHealthState } from '../types/StorageHealthState';

export interface AdaptiveEnvironmentStatus {
  connectivity: ConnectivityState;
  estimatedSpeedMbps: number;
  availableStorageMB: number;
  storageHealth: StorageHealthState;
  isLightweightAutoActive: boolean;
  isStoreAndForwardActive: boolean;
  isAutoPruneActive: boolean;
  lastCheckedAt: string;
}
