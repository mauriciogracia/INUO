import { SemanticEntity } from "../types/SemanticEntity";
import { SemanticAction } from "../types/SemanticAction";

export interface InuoEventEnvelope<T = any> {
  eventId: string;
  eventType: string;
  entity: SemanticEntity;
  action: SemanticAction;
  timestamp: string;
  sourceNodeId: string;
  payload: T;
}
