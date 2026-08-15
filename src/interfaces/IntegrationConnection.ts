import { IntegrationCategory } from '../types/IntegrationCategory';
import { IntegrationAuthType } from '../types/IntegrationAuthType';
import { PreferenceScope } from '../types/PreferenceScope';

export interface IntegrationConnection {
  id: string;
  name: string;
  category: IntegrationCategory;
  provider: string;
  authType: IntegrationAuthType;
  endpoint?: string;
  status: 'Connected' | 'Disconnected' | 'RateLimited' | 'Error';
  scope: PreferenceScope;
  scopeId?: string;
  vaultSecretKeyRef?: string;
  rateLimitPerMinute?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
