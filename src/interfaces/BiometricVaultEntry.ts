/**
 * Localized biometric credential vault entry stored strictly inside a specific Master Mind instance.
 */
export interface BiometricVaultEntry {
  /** Unique member ID */
  memberId: string;

  /** Display name of trusted member */
  memberName: string;

  /** Local salt/hash of member PIN */
  pinHash?: string;

  /** Local acoustic voiceprint spectrum feature vector */
  voiceprintVector?: number[];

  /** Local facial feature embedding vector */
  facialEmbeddingVector?: number[];

  /** Local 2FA OTP secret key */
  otpSecret?: string;

  /** ISO Timestamp of last credential update */
  updatedAt: string;
}
