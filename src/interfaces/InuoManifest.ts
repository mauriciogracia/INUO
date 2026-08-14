import { ServiceModuleMapping } from './ServiceModuleMapping';

export interface InuoManifest {
  /** Target specification version following SemVer MAJOR.MINOR.PATCH (e.g. '0.1.0') */
  SPEC_VERSION: string;
  
  /** Seed Agent CLI logic version */
  cliVersion: string;
  
  /** Localized directory structure mappings for Verb + Object pairs */
  moduleMappings: ServiceModuleMapping[];
  
  /** Timestamp of last manifest sync */
  lastSyncedAt: string;
}
