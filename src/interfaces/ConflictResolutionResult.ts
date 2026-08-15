import { ConflictResolutionTier } from '../types/ConflictResolutionTier';

export interface FieldConflict {
  field: string;
  localValue: any;
  remoteValue: any;
  baseValue?: any;
  resolutionChoice?: 'local' | 'remote' | 'custom';
  resolvedValue?: any;
}

export interface ConflictResolutionResult<T = Record<string, any>> {
  tier: ConflictResolutionTier;
  isResolved: boolean;
  mergedEntity: T;
  conflicts: FieldConflict[];
  summary: string;
}
