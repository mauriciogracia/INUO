import { EmergencyStatus } from '../types/EmergencyStatus';

/**
 * Real-time emergency state context governing fallback authorization and safety boundaries.
 */
export interface EmergencyContext {
  /** Current emergency status ('Normal' | 'EmergencyActive' | 'OwnerIncapacitated') */
  status: EmergencyStatus;

  /** User ID of incapacitated owner/master trainer if triggered */
  incapacitatedUser?: string;

  /** List of pre-registered family member user IDs authorized during emergencies */
  authorizedFamilyUserIds: string[];

  /** Geographical location / safety context */
  emergencyLocation?: string;

  /** ISO Timestamp when emergency mode was activated */
  activatedAt: string;
}
