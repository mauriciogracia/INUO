/**
 * State tracking progressive Master Mind download and authorization gating.
 */
export interface MasterMindSyncProgress {
  /** Unique sync session ID */
  syncId: string;

  /** True if essential skills (Tier 0) are downloaded for offline basic operations */
  essentialSkillsDownloaded: boolean;

  /** Total remaining Master Mind payload size in bytes */
  totalPayloadSizeBytes: number;

  /** Current estimated network connectivity speed in Mbps */
  estimatedSpeedMbps: number;

  /** Calculated estimated download duration in minutes */
  estimatedDurationMinutes: number;

  /** True if estimated download duration exceeds 15 minutes */
  requiresUserAuthorization: boolean;

  /** True if user has authorized long download */
  isUserAuthorized: boolean;

  /** Current sync status */
  status: 'PendingAuthorization' | 'Syncing' | 'Completed' | 'Deferred';

  /** ISO Timestamp when sync was initiated */
  startedAt: string;
}
