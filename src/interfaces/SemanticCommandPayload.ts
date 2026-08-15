import { SemanticEntity } from '../types/SemanticEntity';
import { SemanticAction } from '../types/SemanticAction';

export interface SemanticCommandPayload {
  entity: SemanticEntity;
  action: SemanticAction;
  targetId?: string;
  options: Record<string, any>;
  rawArgs: string[];
}
