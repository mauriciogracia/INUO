import { MatchStatus } from '../types/MatchStatus';
import { ExternalFulfillmentDetails } from './ExternalFulfillmentDetails';

export interface Match {
  /** Unique match identifier */
  id: string;
  
  /** ID of the associated Need */
  needId: string;
  
  /** ID of the associated Offer */
  offerId: string;
  
  /** The requesting verb */
  verb: string;
  
  /** The fulfilling complement verb */
  complementVerb: string;
  
  /** Validation status of the match */
  status: MatchStatus;
  
  /** Timestamp when match was programmatically validated */
  matchedAt: string;
  
  /** External fulfillment details if resolved via ecosystem adapter */
  externalFulfillment?: ExternalFulfillmentDetails;
}
