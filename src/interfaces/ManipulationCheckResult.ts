import { ManipulationCategory } from '../types/ManipulationCategory';

/**
 * Result of auditing a prompt, payload, or dataset for adversarial manipulation attempts.
 */
export interface ManipulationCheckResult {
  /** True if adversarial manipulation attempt was detected */
  isManipulative: boolean;

  /** Category of detected manipulation */
  category?: ManipulationCategory;

  /** Matched adversarial pattern signature */
  matchedPattern?: string;

  /** Enforcement action taken ('Blocked' | 'Quarantined' | 'Allowed') */
  actionTaken: 'Blocked' | 'Quarantined' | 'Allowed';

  /** Origin source of audited text ('PeerNode' | 'ExternalAI' | 'MCPServer' | 'UserInput') */
  source: 'PeerNode' | 'ExternalAI' | 'MCPServer' | 'UserInput';

  /** Explanation of security violation */
  explanation?: string;

  /** ISO Timestamp of check */
  checkedAt: string;
}
