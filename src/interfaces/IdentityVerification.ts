import { SensitiveDomain } from '../types/SensitiveDomain';

export interface IdentityVerification {
  /** User or entity ID */
  userId: string;
  
  /** Domain classification for identity checks */
  domain: SensitiveDomain;
  
  /** Verification status */
  status: 'Verified' | 'Pending' | 'Rejected';
  
  /** Verification timestamp */
  verifiedAt?: string;
  
  /** Identity credential provider reference */
  identityProviderRef?: string;
}
