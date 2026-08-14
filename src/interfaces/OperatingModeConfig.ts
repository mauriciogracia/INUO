import { OperatingMode } from '../types/OperatingMode';

/**
 * Operational mode configuration governing INUO's interaction paradigm.
 */
export interface OperatingModeConfig {
  /** Active operating mode ('promptMe' | 'letMeServeYou') */
  currentMode: OperatingMode;

  /** Auto-detected or preferred interaction language ('en' | 'es' | 'fr' | 'de' | 'pt') */
  detectedLanguage: string;

  /** True if language is dynamically determined from user input */
  autoDetectLanguage: boolean;

  /** True if succinct mode is active (concise, direct response, no tables, use bullet lists) */
  isSuccinctMode?: boolean;

  /** Customized host concierge greeting text */
  hostGreetingText?: string;

  /** True if host mode forces authentication check on startup */
  authRequiredOnStart: boolean;

  /** ISO Timestamp of last mode update */
  updatedAt: string;
}
