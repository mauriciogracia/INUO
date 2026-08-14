import { EnforcementAction } from '../types/EnforcementAction';

export interface PolicyEnforcement {
  /** Violation identifier */
  id: string;
  
  /** Target entity ID subject to enforcement */
  entityId: string;
  
  /** Reason for policy trigger (e.g. prohibited content, trust loop violation) */
  reason: string;
  
  /** Action taken by governance engine */
  action: EnforcementAction;
  
  /** Timestamp of enforcement */
  enforcedAt: string;
}
