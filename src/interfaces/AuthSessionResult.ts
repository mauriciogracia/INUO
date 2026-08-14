import { AuthMethod } from '../types/AuthMethod';
import { UserIdentity } from './UserIdentity';

/**
 * Result returned when authenticating a user, device, or Master Trainer session.
 */
export interface AuthSessionResult {
  /** True if sign-in authentication succeeded */
  success: boolean;

  /** Status message or explanation */
  message: string;

  /** Authentication method utilized */
  authMethod?: AuthMethod;

  /** Authenticated user identity */
  identity?: UserIdentity;

  /** Session token */
  sessionToken?: string;

  /** ISO Timestamp when session expires */
  expiresAt?: string;
}
