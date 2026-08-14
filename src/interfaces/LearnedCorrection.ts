/**
 * Represents a learned rule or skill acquired from user corrections/feedback.
 */
export interface LearnedCorrection {
  /** Unique correction entry ID */
  id: string;

  /** Topic or verb area of correction */
  topic: string;

  /** Summary of original misunderstanding or query */
  originalUnderstanding?: string;

  /** Corrected rule directive provided by the user */
  correctedRule: string;

  /** User ID of the Knowledge Provider who supplied the correction */
  providedByUserId: string;

  /** Timestamp created */
  createdAt: string;
}
