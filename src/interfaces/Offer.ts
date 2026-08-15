import { ModelType } from '../types/ModelType';
import { OfferStatus } from '../types/OfferStatus';

export interface Offer {
  /** Unique identifier for the Offer */
  id: string;
  
  /** Target Need ID if directly addressing a specific Need */
  needId?: string;
  
  /** Complementary action verb matching the Need VERB (e.g., 'Donate', 'Sell', 'Advise') */
  complementVerb: string;
  
  /** The offered product, service, or interaction object */
  object: string;
  
  /** Identifier of the provider entity (User, Organization, or External Service) */
  providerId: string;
  
  /** Model isolation boundary: Transactional vs Gift-Based */
  modelType: ModelType;
  
  /** Details or payload describing the fulfillment offer */
  details: string;
  
  /** Operational status of the offer */
  status: OfferStatus;
  
  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt?: string;
}

