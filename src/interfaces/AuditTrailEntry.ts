export interface AuditTrailEntry {
  /** Unique log entry ID */
  id: string;
  
  /** ISO timestamp */
  timestamp: string;
  
  /** ID of entity performing action */
  actorId: string;
  
  /** Interaction/Need ID */
  interactionId: string;
  
  /** Description of recorded event */
  action: string;
  
  /** SHA-256 cryptographic hash of payload content */
  payloadHash: string;
  
  /** Deletion restriction flag enforcing immutability */
  isImmutable: true;
}
