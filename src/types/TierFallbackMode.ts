/**
 * Defines the operating tier fallback strategy for cost governance and token conservation.
 * - 'FreeTierFirst': Use free tier models first; prompt for confirmation before using paid models.
 * - 'PaidAllowed': User has explicitly consented to use paid models.
 * - 'FreeOnly': Strictly reject paid models and never consume billable tokens.
 */
export type TierFallbackMode = 'FreeTierFirst' | 'PaidAllowed' | 'FreeOnly';
