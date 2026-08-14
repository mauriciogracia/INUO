import { Need } from './Need';
import { DependencyEdge } from './DependencyEdge';

export interface DependencyGraph {
  /** Root Macro-Need ID */
  macroNeedId: string;
  
  /** High-level goal statement (e.g. 'Construct 10km Desert Road') */
  goalDescription: string;
  
  /** List of atomic needs in the graph */
  nodes: Need[];
  
  /** Dependency edges connecting parent and prerequisite needs */
  edges: DependencyEdge[];
  
  /** Overall graph execution state */
  overallStatus: 'Blocked' | 'InProgress' | 'Completed';
}
