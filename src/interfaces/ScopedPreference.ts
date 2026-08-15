import { PreferenceScope } from '../types/PreferenceScope';

export interface ScopedPreference {
  key: string;
  value: any;
  scope: PreferenceScope;
  scopeId?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
