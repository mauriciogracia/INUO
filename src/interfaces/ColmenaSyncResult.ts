/**
 * Execution result of a federated Colmena hivemind synchronization.
 */
export interface ColmenaSyncResult {
  /** Target peer node ID */
  nodeId: string;

  /** Number of peer Needs synchronized */
  syncedNeedsCount: number;

  /** Number of peer Offers synchronized */
  syncedOffersCount: number;

  /** Number of federated skills/rules merged */
  mergedSkillsCount: number;

  /** Status message */
  message: string;

  /** Timestamp executed */
  syncedAt: string;
}
