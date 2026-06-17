/**
 * Centralized application configuration.
 *
 * All environment-derived values and shared constants live here so that screens
 * and components never embed hard-coded literals (e.g. the backend base URL).
 *
 * The backend base URL is read from the `EXPO_PUBLIC_API_BASE_URL` environment
 * variable. Expo inlines any `EXPO_PUBLIC_*` variable into the JS bundle at build
 * time, so it is available via `process.env` on the client.
 */

/**
 * Fallback base URL used when `EXPO_PUBLIC_API_BASE_URL` is not provided.
 *
 * `localhost` only works for web / iOS simulator. When running on a physical
 * device or Android emulator, set `EXPO_PUBLIC_API_BASE_URL` to your machine's
 * LAN IP (see `.env.example`).
 */
const DEFAULT_API_BASE_URL = 'http://localhost:3000';

/**
 * Resolve the backend base URL from the environment, trimming whitespace and any
 * trailing slash so callers can safely concatenate paths like `/auth/send-otp`.
 */
function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  const raw = fromEnv && fromEnv.trim().length > 0 ? fromEnv.trim() : DEFAULT_API_BASE_URL;
  return raw.replace(/\/+$/, '');
}

/** The resolved backend base URL (no trailing slash). */
export const API_BASE_URL: string = resolveApiBaseUrl();

/**
 * Default request timeout in milliseconds. Ensures callers never hang
 * indefinitely on a stalled network request (Requirement 2.4).
 */
export const REQUEST_TIMEOUT_MS = 15000;

/** Number of digits in an OTP code (backend-verified). */
export const OTP_LENGTH = 6;

/**
 * OTP validity window in seconds (backend-verified: 5 minutes).
 * Useful for client-side countdown / resend UX.
 */
export const OTP_EXPIRY_SECONDS = 300;

/** Maximum OTP verification attempts allowed by the backend. */
export const OTP_MAX_ATTEMPTS = 3;

/**
 * Canonical Iranian mobile number format accepted by the backend
 * (`^09\d{9}$`, e.g. `09123456789`).
 */
export const IRAN_PHONE_REGEX = /^09\d{9}$/;

/** Default number of items to request per page for paginated list endpoints. */
export const DEFAULT_PAGE_SIZE = 20;

/** Page number to start pagination from (backend pages are 1-indexed). */
export const DEFAULT_INITIAL_PAGE = 1;

/**
 * Interval in milliseconds between watch-history progress posts while a video
 * is playing (Requirement 7.4).
 */
export const WATCH_PROGRESS_INTERVAL_MS = 10000;

/**
 * Aggregated config object for ergonomic imports, e.g. `import { config } from '@/config'`.
 */
export const config = {
  apiBaseUrl: API_BASE_URL,
  requestTimeoutMs: REQUEST_TIMEOUT_MS,
  otpLength: OTP_LENGTH,
  otpExpirySeconds: OTP_EXPIRY_SECONDS,
  otpMaxAttempts: OTP_MAX_ATTEMPTS,
  iranPhoneRegex: IRAN_PHONE_REGEX,
  defaultPageSize: DEFAULT_PAGE_SIZE,
  defaultInitialPage: DEFAULT_INITIAL_PAGE,
  watchProgressIntervalMs: WATCH_PROGRESS_INTERVAL_MS,
} as const;

export default config;
