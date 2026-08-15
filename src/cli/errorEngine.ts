import { getI18n } from "../i18n";

/**
 * Parses technical runtime and API errors into user-friendly natural language representations
 * in the active interaction language.
 *
 * Catches token quota / rate limiting, invalid API credentials, network failures,
 * model overloads, and unexpected runtime faults.
 */
export function formatTechnicalError(
  error: unknown,
  lang: string = "es",
): string {
  const dict = getI18n(lang);
  const errMsg = (
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error || "")
  ).toLowerCase();

  const errStatus = (error as any)?.status || (error as any)?.statusCode;

  // 1. Quota / Rate Limit / Token limit reached
  if (
    errStatus === 429 ||
    errMsg.includes("429") ||
    errMsg.includes("resource_exhausted") ||
    errMsg.includes("quota") ||
    errMsg.includes("cuota") ||
    errMsg.includes("rate limit") ||
    errMsg.includes("ratelimit") ||
    errMsg.includes("too many requests") ||
    errMsg.includes("token limit") ||
    errMsg.includes("token quota")
  ) {
    return dict.errors.tokenQuotaReached;
  }

  // 2. Missing, invalid or unauthorized API key
  if (
    errStatus === 401 ||
    errStatus === 403 ||
    errMsg.includes("401") ||
    errMsg.includes("403") ||
    errMsg.includes("api_key_invalid") ||
    errMsg.includes("invalid api key") ||
    errMsg.includes("api key not valid") ||
    errMsg.includes("permission_denied") ||
    errMsg.includes("unauthorized")
  ) {
    return dict.errors.invalidApiKey;
  }

  // 3. Network connection / DNS / Timeout failures
  if (
    errMsg.includes("econnrefused") ||
    errMsg.includes("enotfound") ||
    errMsg.includes("etimedout") ||
    errMsg.includes("fetch failed") ||
    errMsg.includes("networkerror") ||
    errMsg.includes("failed to fetch") ||
    errMsg.includes("network error") ||
    errMsg.includes("socket hang up")
  ) {
    return dict.errors.networkError;
  }

  // 4. Service unavailable / Model overloaded
  if (
    errStatus === 503 ||
    errStatus === 500 ||
    errMsg.includes("503") ||
    errMsg.includes("unavailable") ||
    errMsg.includes("overloaded") ||
    errMsg.includes("sobrecargado") ||
    errMsg.includes("high demand")
  ) {
    return dict.errors.serviceUnavailable;
  }

  // 5. Default natural language representation for general errors
  const cleanMsg = (
    error instanceof Error ? error.message : String(error)
  ).replace(/\x1b\[[0-9;]*m/g, "");

  return `${dict.errors.generalTechnicalError} ${cleanMsg}`;
}
