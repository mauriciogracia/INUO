/**
 * Curated few-shot training example for self-improving intent parsing and skill execution.
 */
export interface TrainingPair {
  id: string;
  category: string;
  prompt: string;
  expectedNeed?: {
    verb: string;
    object: string;
  } | null;
  expectedOffer?: {
    verb: string;
    object: string;
  } | null;
  skillRecipe?: Record<string, any> | null;
  createdAt: string;
}
