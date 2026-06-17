/**
 * Shared API request/response types and data models for the candidate app.
 *
 * These mirror the subset of the JamJoys backend contract relevant to the
 * assignment, derived from the real backend. Exact field names for some
 * list/paginate responses may vary; the candidate is instructed to inspect
 * actual responses where needed.
 */

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Request body for `POST /auth/send-otp`. Phone must match `^09\d{9}$`. */
export type SendOtpReq = { phoneNumber: string };

/**
 * Response from `POST /auth/send-otp`.
 * In non-production the `otp` is returned in the response (and logged
 * server-side), making the flow testable without a real SMS gateway.
 */
export type SendOtpRes = {
  message: string;
  phoneNumber: string;
  expiresIn: number;
  otp?: string;
};

/** Request body for `POST /auth/verify-otp`. `otp` is 6 digits. */
export type VerifyOtpReq = { phoneNumber: string; otp: string };

/** The authenticated user, as returned by verify-otp and `GET /auth/me`. */
export type AuthUser = {
  id: string;
  phoneNumber: string;
  avatar: string | null;
  role: string;
  isSubscribed: boolean;
  subscriptionExpiresAt: string | null;
};

/** Response from `POST /auth/verify-otp`. */
export type VerifyOtpRes = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

/** Request body for `POST /auth/refresh`. */
export type RefreshReq = { refreshToken: string };

/**
 * Response from `POST /auth/refresh`.
 * NOTE: returns ONLY a new access token — no new refresh token. The client
 * must keep reusing the stored refresh token until it expires (7d).
 */
export type RefreshRes = { accessToken: string };

/** Persisted shape of the Auth_Store. */
export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  status: 'unknown' | 'authenticated' | 'unauthenticated';
};

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

/**
 * Game fields the UI must read (a richer object exists server-side).
 * Display values are derived from `categoryConfig` / `difficultyConfig` —
 * NOT from the legacy `category` / `difficulty` enum fields.
 */
export type Game = {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string | null;
  categoryConfig?: Record<string, unknown>;
  difficultyConfig?: Record<string, unknown>;
  videos?: Video[];
};

/** Generic paginated list response. */
export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

export type Video = {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  thumbnail?: string | null;
};

/** Response from `GET /videos/:id/validate-access`. */
export type ValidateAccessRes = { hasAccess: boolean; message: string };

// ---------------------------------------------------------------------------
// Favorites / watch history
// ---------------------------------------------------------------------------

/** Response from `GET /favorites/:gameId/check`. */
export type FavoriteCheckRes = { isFavorite: boolean };

export type WatchHistoryItem = {
  videoId: string;
  progress: number;
  updatedAt: string;
  video?: Video;
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/** Response from `GET /users/me/token-balance`. */
export type TokenBalanceRes = { balance: number };

// ---------------------------------------------------------------------------
// Standard client error
// ---------------------------------------------------------------------------

/**
 * Structured error every non-2xx response and transport failure is
 * translated into by the centralized API client.
 */
export type ApiError = { status: number; message: string; data?: unknown };
