import { TierFallbackMode } from '../types/TierFallbackMode';

/**
 * Configuration schema for cost governance, free-tier prioritization, cascading fallback, and token conservation.
 */
export interface CostGovernanceConfig {
  /** Operating tier fallback strategy */
  tierMode: TierFallbackMode;

  /** Health/quota availability status of the free tier */
  freeTierStatus: 'Available' | 'Exhausted' | 'RateLimited';

  /** Explicit user consent status to execute paid models / consume billable tokens */
  paidTierConsent: boolean;

  /** Preferred zero-cost / free model (default: 'gemini-flash-latest') */
  preferredFreeModel: string;

  /** Preferred paid / Pro tier model (default: 'gemini-pro-latest') */
  preferredPaidModel: string;

  /** Pool of candidate free models/providers evaluated in priority order */
  freeModelsPool: string[];

  /** Pool of available paid models/providers requiring explicit user consent */
  paidModelsPool: string[];

  /** List of free models that have currently exceeded quota / rate limits */
  exhaustedFreeModels: string[];

  /** Currently selected/authorized paid model when consent is granted */
  selectedPaidModel?: string;

  /** Currently active model selected by cost governance */
  activeModel: string;

  /** Timestamp of last quota exhaustion event if any */
  lastExhaustedAt?: string;

  /** ISO timestamp of last update */
  updatedAt: string;
}
