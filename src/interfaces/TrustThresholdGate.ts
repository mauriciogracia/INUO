import { UserRole } from '../types/UserRole';

/**
 * Multi-party threshold trust gate protecting high-security assets (phone PINs, car keys, bank accounts).
 * Requires the combined sum of trust scores across co-signing members to meet or exceed requiredTrustScore.
 */
export interface TrustThresholdGate {
  /** Unique threshold gate ID */
  gateId: string;

  /** Name of protected asset (e.g., 'Car_Key_Location', 'Phone_PIN', 'Safe_Deposit_Box') */
  assetName: string;

  /** Minimum combined trust score required to unlock asset (e.g., 150) */
  requiredTrustScore: number;

  /** Protected sensitive data payload */
  protectedData: string;

  /** Role that created the threshold gate */
  createdByRole: UserRole;

  /** ISO Timestamp of creation/update */
  updatedAt: string;
}
