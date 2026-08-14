import { SyncStatus } from '../types/SyncStatus';

export interface SyncResult {
  currentManifestVersion: string;
  targetSpecVersion: string;
  status: SyncStatus;
  message: string;
}
