import { OAuth2Config } from './OAuth2Config';
import { ResilienceState } from '../types/ResilienceState';

export interface EcosystemAdapter {
  /** Adapter identifier */
  id: string;
  
  /** External service provider name (e.g. 'Uber', 'LinkedIn', 'MercadoLibre') */
  providerName: string;
  
  /** Supported Need object types mapped by this adapter */
  supportedObjects: string[];
  
  /** Identity unification configuration */
  authConfig: OAuth2Config;
  
  /** Current connection resilience state */
  resilienceState: ResilienceState;
  
  /** Queue of pending requests when provider is unreachable */
  queuedRequestsCount: number;
}
