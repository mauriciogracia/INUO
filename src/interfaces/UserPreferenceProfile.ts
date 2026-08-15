import { ResponseLength } from "../types/ResponseLength";
import { ResponseFormat } from "../types/ResponseFormat";

/**
 * Learned response-style preferences for a single user, persisted across sessions
 * and shareable via the training dataset export.
 */
export interface UserPreferenceProfile {
  userId: string;

  /** How long responses should be */
  responseLength?: ResponseLength;

  /** Whether to use prose, bullet lists, or structured (table) layout */
  responseFormat?: ResponseFormat;

  /** Explicit preference on tables (true = use them, false = avoid them) */
  preferTables?: boolean;

  /** Number of preference signals captured so far */
  signalCount: number;

  /** ISO timestamp of last update */
  updatedAt: string;
}
