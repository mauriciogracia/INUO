import { RelationshipType } from '../types/RelationshipType';
import { TrustLevel } from '../types/TrustLevel';

/**
 * Configuration and multi-device bindings for a trusted member (Family, Friend, Emergency Contact) in the Master Mind.
 */
export interface TrustedMemberConfig {
  /** Unique member ID */
  memberId: string;

  /** Display name of trusted member */
  memberName: string;

  /** Relationship classification ('Family' | 'TrustedFriend' | 'EmergencyContact' | 'MasterTrainer') */
  relationshipType: RelationshipType;

  /** Array of bound trusted client device IDs (phones, watches, TVs, CLI sessions) */
  trustedDeviceIds: string[];

  /** Dynamic trust score (0 to 100) */
  trustScore: number;

  /** Dynamic trust level */
  trustLevel: TrustLevel;

  /** ISO Timestamp when member was added */
  addedAt: string;
}
