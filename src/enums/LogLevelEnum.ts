/**
 * LogLevelEnum defines the system logging verbosity levels.
 * Level 0: OFF (Errors only)
 * Level 1: INFO (Default - standard user output & clean feedback)
 * Level 2: DEBUG (Detailed - AI prompt introspection, command sequences, trust updates)
 * Level 3: TRACE (Verbose - full JSON payloads, raw API requests)
 */
export enum LogLevelEnum {
  OFF = 0,
  INFO = 1,
  DEBUG = 2,
  TRACE = 3,
}
