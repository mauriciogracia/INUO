import { StateData } from '../cli/context';

/**
 * Snapshot representing a versioned state of the central Master Mind in the 3-version ring buffer.
 */
export interface MasterMindSnapshot {
  /** Unique snapshot identifier */
  snapshotId: string;

  /** Master Mind version tag */
  version: string;

  /** ISO Timestamp of snapshot creation */
  timestamp: string;

  /** Summary description of snapshot checkpoint */
  summary: string;

  /** Count of Needs at snapshot time */
  needsCount: number;

  /** Count of Offers at snapshot time */
  offersCount: number;

  /** Count of registered Skills at snapshot time */
  skillsCount: number;

  /** Serialized state data snapshot */
  stateData: StateData;
}
