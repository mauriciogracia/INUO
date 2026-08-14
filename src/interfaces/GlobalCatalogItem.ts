import { CatalogCategory } from '../types/CatalogCategory';
import { VerbPairing } from './VerbPairing';

export interface GlobalCatalogItem {
  /** Canonical catalog item ID */
  id: string;
  
  /** Item name (e.g. 'Geotechnical Survey', 'Bicycle', 'Career Mentorship') */
  name: string;
  
  /** Category classification to prevent namespace collisions */
  category: CatalogCategory;
  
  /** Canonical namespace identifier */
  namespace: string;
  
  /** Validated verb/complement pairings supported by this catalog object */
  supportedPairings: VerbPairing[];
  
  /** Optional metadata schema */
  metadata?: Record<string, unknown>;
}
