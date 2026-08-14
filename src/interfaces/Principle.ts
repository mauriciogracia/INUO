import { PrincipleStatus } from '../types/PrincipleStatus';

/**
 * Immutable governance principle created exclusively by the Master Trainer.
 * Principles CANNOT be bent, overridden, or deleted by regular users.
 */
export interface Principle {
  /** Unique principle ID */
  id: string;

  /** Principle title/name */
  name: string;

  /** Formal unbendable directive statement */
  statement: string;

  /** Strict creator restriction: must be 'MasterTrainer' */
  createdBy: 'MasterTrainer';

  /** Always true: unbendable and immutable by regular users */
  isImmutable: true;

  /** Status in governance engine ('Active' | 'Locked') */
  status: PrincipleStatus;

  /** Timestamp created */
  createdAt: string;
}
