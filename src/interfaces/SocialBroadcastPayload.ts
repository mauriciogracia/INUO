/**
 * Result payload produced when an Engine dispatches multi-platform social media API posts.
 */
export interface SocialBroadcastPayload {
  /** Unique broadcast execution ID */
  broadcastId: string;

  /** Message content dispatched */
  message: string;

  /** Target social platforms (e.g., 'twitter', 'linkedin', 'facebook', 'telegram') */
  targetPlatforms: string[];

  /** Media URLs attached */
  mediaUrls?: string[];

  /** User ID that dispatched the broadcast */
  dispatchedByUserId: string;

  /** Per-platform execution success status */
  results: Record<string, boolean>;

  /** ISO Timestamp of broadcast dispatch */
  dispatchedAt: string;
}
