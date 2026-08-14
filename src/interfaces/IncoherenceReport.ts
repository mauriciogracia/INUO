/**
 * Result of evaluating a prompt, skill, or action for incoherence against active Master Trainer Principles.
 */
export interface IncoherenceReport {
  /** True if prompt/skill conflicts with an active immutable Principle */
  hasIncoherence: boolean;

  /** ID of conflicting Principle if detected */
  conflictingPrincipleId?: string;

  /** Name of conflicting Principle if detected */
  conflictingPrincipleName?: string;

  /** Explanation of incoherence or conflict reason */
  explanation?: string;

  /** ISO Timestamp when check was performed */
  checkedAt: string;
}
