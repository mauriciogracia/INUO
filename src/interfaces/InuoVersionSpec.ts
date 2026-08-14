/**
 * Structured breakdown of INUO's canonical versioning model (aa.bb.cc).
 */
export interface InuoVersionSpec {
  /** aa: Percentage of deployed production functionality (0 to 100) */
  deployedPercentage: number;

  /** bb: Percentage of implemented and verified codebase features (0 to 100) */
  implementationPercentage: number;

  /** cc: Specification revision / spec bumping index (0 to 99) */
  specRevisionIndex: number;

  /** Formatted version string (e.g. '01.95.02') */
  fullVersionString: string;

  /** ISO Timestamp of version computation */
  calculatedAt: string;
}
