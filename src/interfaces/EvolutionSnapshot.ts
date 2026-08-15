/**
 * Atomic snapshot capturing codebase state prior to self-evolution, enabling instant rollback on verification failure.
 */
export interface EvolutionSnapshot {
  timestamp: string;
  preVersion: string;
  filesBackup: Array<{
    relativePath: string;
    content: string | null; // null if the file did not exist previously
  }>;
  createdFiles: string[];
}
