/**
 * Centralized API client.
 *
 * A single, reusable axios instance that every screen and resource module uses
 * to talk to the JamJoys backend. It is configured with the
 * backend base URL and a request timeout so callers never hang indefinitely on
 * a stalled network request.
 *
 * All failures — both non-2xx HTTP responses and transport-level problems
 * (timeout, DNS failure, no network) — are translated into a single structured
 * `ApiError { status, message, data? }` via {@link toApiError},
 * so callers never have to reason about raw axios error shapes.
 *
 * The request/response interceptors implement the token lifecycle:
 *
 *   - Request: attach the access token as a Bearer credential when the
 *     Auth_Store holds one.
 *   - Response: on HTTP 401, refresh the access token via `POST /auth/refresh`
 *     (reusing the stored refresh token), apply the new token, and retry the
 *     original request exactly once. Parallel 401s share a single in-flight
 *     refresh. On refresh failure the session is cleared.
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config';
import { useAuthStore } from '../store/authStore';
import type { ApiError, RefreshRes } from './types';

/**
 * Sentinel status used for errors that never reached the backend (timeouts,
 * connection refused, DNS failures, offline). A real HTTP response always has a
 * status in the 1xx–5xx range, so `0` unambiguously marks a transport failure.
 */
export const TRANSPORT_ERROR_STATUS = 0 as const;

/** Fallback message when the backend supplies no usable error message. */
const DEFAULT_HTTP_ERROR_MESSAGE = 'Request failed';

/** Human-readable message for a request that timed out client-side. */
const TIMEOUT_ERROR_MESSAGE =
  'The request timed out. Please check your connection and try again.';

/** Human-readable message for a request that never reached the server. */
const NETWORK_ERROR_MESSAGE =
  'Unable to reach the server. Please check your connection and try again.';

/**
 * The single shared axios instance. Resource modules (auth, games, videos, …)
 * and the Auth_Store issue every request through this instance so configuration
 * (base URL, timeout, and interceptors) lives in exactly one place.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Type guard: is this value an axios error (carries `isAxiosError`)? */
function isAxiosError(err: unknown): err is AxiosError {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { isAxiosError?: boolean }).isAxiosError === true
  );
}

/**
 * Already-translated errors carry `status` + `message`. Detect them so a value
 * passed through `toApiError` twice is returned unchanged (idempotent).
 */
function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as ApiError).status === 'number' &&
    typeof (err as ApiError).message === 'string'
  );
}

/**
 * Extract the most meaningful human-readable message from a backend error body.
 *
 * NestJS error responses are typically shaped `{ message: string | string[],
 * error?: string, statusCode?: number }`. The `message` field may be an array
 * of validation messages, so it is joined when present.
 */
function extractMessageFromBody(data: unknown): string | undefined {
  if (typeof data === 'string') {
    return data.trim().length > 0 ? data : undefined;
  }
  if (typeof data !== 'object' || data === null) {
    return undefined;
  }

  const body = data as { message?: unknown; error?: unknown };

  if (Array.isArray(body.message)) {
    const joined = body.message
      .filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
      .join(', ');
    if (joined.length > 0) {
      return joined;
    }
  } else if (typeof body.message === 'string' && body.message.trim().length > 0) {
    return body.message;
  }

  if (typeof body.error === 'string' && body.error.trim().length > 0) {
    return body.error;
  }

  return undefined;
}

/**
 * Translate any thrown/rejected value into a structured {@link ApiError}.
 *
 * - **Non-2xx HTTP response**: `status` is the response status and `message` is
 *   the backend-supplied error message (e.g. `response.data.message`), falling
 *   back to a sensible default. The raw response body is preserved on `data`.
 * - **Transport / timeout failure** (no response received): `status` is
 *   {@link TRANSPORT_ERROR_STATUS} (`0`) and `message` is a human-readable
 *   explanation distinguishing a timeout from a general network failure.
 * - **Already an `ApiError`**: returned unchanged (idempotent).
 * - **Anything else**: wrapped with the transport sentinel and a best-effort
 *   message so callers always receive a consistent shape.
 *
 * This function never throws; it always returns an `ApiError`.
 *
 */
export function toApiError(err: unknown): ApiError {
  // Idempotent: don't double-wrap an already-translated error.
  if (isApiError(err)) {
    return err;
  }

  if (isAxiosError(err)) {
    const response = err.response;

    // A response was received => genuine non-2xx HTTP error.
    if (response) {
      const message =
        extractMessageFromBody(response.data) ??
        (typeof err.message === 'string' && err.message.trim().length > 0
          ? err.message
          : DEFAULT_HTTP_ERROR_MESSAGE);

      return {
        status: response.status,
        message,
        data: response.data,
      };
    }

    // No response => transport-level failure (timeout, offline, DNS, etc.).
    const isTimeout =
      err.code === 'ECONNABORTED' ||
      err.code === 'ETIMEDOUT' ||
      /timeout/i.test(err.message ?? '');

    return {
      status: TRANSPORT_ERROR_STATUS,
      message: isTimeout ? TIMEOUT_ERROR_MESSAGE : NETWORK_ERROR_MESSAGE,
    };
  }

  // Non-axios Error instances and unknown throwables.
  if (err instanceof Error && err.message.trim().length > 0) {
    return { status: TRANSPORT_ERROR_STATUS, message: err.message };
  }

  return { status: TRANSPORT_ERROR_STATUS, message: NETWORK_ERROR_MESSAGE };
}

/**
 * Thin convenience wrapper around `apiClient.request` that guarantees every
 * rejection is mapped through {@link toApiError}. Resource modules may use this
 * (or `apiClient` directly) so callers uniformly receive an `ApiError` on
 * failure rather than a raw axios error.
 *
 * Resolved responses pass through unchanged. The 401 refresh/retry behavior
 * configured on `apiClient` applies here automatically.
 */
export async function request<T = unknown>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  try {
    return await apiClient.request<T>(config);
  } catch (err) {
    throw toApiError(err);
  }
}

// ---------------------------------------------------------------------------
// Interceptors: Bearer-token attach + 401 refresh/retry
// ---------------------------------------------------------------------------

/**
 * Per-request config augmented with our retry guard. The `_retry` flag marks a
 * request that has already been retried once after a refresh, so a second 401
 * on the retried request does NOT trigger another refresh/retry (no infinite
 * loop).
 */
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/**
 * The single in-flight refresh promise. While a refresh is underway every
 * parallel 401 awaits this same promise instead of issuing its own
 * `POST /auth/refresh`, so a burst of concurrent 401s causes exactly one
 * refresh call.
 */
let refreshPromise: Promise<string> | null = null;

/**
 * Perform a single token refresh, reusing the stored refresh token.
 *
 * The refresh call is issued with a *bare* axios call (NOT through `apiClient`)
 * so that a 401 from the refresh endpoint itself does not re-enter this response
 * interceptor and recurse. The backend returns ONLY `{ accessToken }` — no new
 * refresh token — so the stored refresh token is left untouched for reuse.
 *
 * Resolves with the new access token; rejects if no refresh token is stored or
 * the refresh request fails.
 */
function refreshAccessToken(): Promise<string> {
  const { refreshToken } = useAuthStore.getState();

  if (!refreshToken) {
    return Promise.reject(new Error('No refresh token available'));
  }

  return axios
    .post<RefreshRes>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      {
        timeout: REQUEST_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
      }
    )
    .then((response) => {
      const accessToken = response.data?.accessToken;
      if (typeof accessToken !== 'string' || accessToken.length === 0) {
        throw new Error('Refresh response did not include an access token');
      }
      // Apply the new access token to the store. The stored refresh token is
      // intentionally reused (the backend issues no new one).
      useAuthStore.getState().setAccessToken(accessToken);
      return accessToken;
    });
}

/**
 * Run a refresh, deduplicating concurrent callers behind a single shared
 * promise. The promise is cleared once settled so a later (genuinely new) 401
 * can trigger a fresh refresh.
 */
function getOrStartRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Request interceptor: attach the current access token as a Bearer credential.
 *
 * When the Auth_Store holds no access token the header is left untouched so
 * public requests are unaffected.
 */
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer${accessToken}`);
  }
  return config;
});

/**
 * Response interceptor: 401 refresh-and-retry.
 *
 * On a 401 for a request that has not already been retried, refresh the access
 * token (sharing one in-flight refresh across parallel 401s) and replay the
 * original request once. If the refresh fails the session is cleared
 * (-> unauthenticated) and the original error is surfaced as a structured
 * `ApiError`. The `_retry` guard prevents an infinite loop.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetryableConfig | undefined;

    // Only attempt refresh for genuine 401s on requests we can replay, and only
    // once per request (guarded by `_retry`).
    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(toApiError(error));
    }

    originalRequest._retry = true;

    const { accessToken: tokenBeforeRefresh } = useAuthStore.getState();

    try {
      await getOrStartRefresh();
      originalRequest.headers.set('Authorization', `Bearer ${tokenBeforeRefresh}`);
      return await apiClient.request(originalRequest);
    } catch (refreshError) {
      // Refresh failed: drop the session so the app returns to sign-in.
      useAuthStore.getState().clearSession();
      return Promise.reject(toApiError(refreshError));
    }
  }
);

export default apiClient;