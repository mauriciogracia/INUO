import { DependencyStatus } from '../types/DependencyStatus';

export interface DependencyEdge {
  /** ID of the parent need */
  parentNeedId: string;
  
  /** ID of the prerequisite need */
  prerequisiteNeedId: string;
  
  /** Current state of the dependency relationship */
  status: DependencyStatus;
}
