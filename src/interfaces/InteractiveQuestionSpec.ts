import { QuestionOptionType } from '../types/QuestionOptionType';

/**
 * Specification for an interactive divide-and-conquer clarification question.
 */
export interface InteractiveQuestionSpec {
  /** Unique question identifier */
  questionId: string;

  /** Target Need ID or ambiguous prompt target */
  targetNeedId?: string;

  /** Question option type ('SingleChoice' | 'MultipleChoice') */
  questionType: QuestionOptionType;

  /** Main question title or prompt */
  questionTitle: string;

  /** Predefined selectable options */
  options: string[];

  /** User selected option(s) */
  selectedOptions?: string[];

  /** True if the user has answered the question */
  isAnswered: boolean;

  /** ISO Timestamp when question was created */
  askedAt: string;

  /** ISO Timestamp when question was answered */
  answeredAt?: string;
}
