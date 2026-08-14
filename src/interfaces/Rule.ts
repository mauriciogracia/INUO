import { UserRole } from '../types/UserRole';

/**
 * Standard operational rule governing workflow behavior or matching logic.
 */
export interface Rule {
  /** Unique rule ID */
  id: string;

  /** Rule name */
  name: string;

  /** Content description or condition of the rule */
  description: string;

  /** Role that created the rule */
  createdByRole: UserRole;

  /** Timestamp created */
  createdAt: string;
}
