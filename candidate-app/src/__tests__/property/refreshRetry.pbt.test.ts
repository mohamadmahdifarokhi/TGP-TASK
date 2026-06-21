// Feature: employment-frontend, Property 5: A single 401 triggers exactly one refresh and one retry with the new token
/**
 * Property 5 — refresh-and-retry sequencing (
 *
 * Implementation under test: the request/response interceptors registered on
 * `apiClient` in `src/api/client.ts`. The refresh itself is issued with a *bare*
 * `axios.post(`${API_BASE_URL}/auth/refresh`)`, so the test drives the network
 * on two independent surfaces:
 *
 *   1. `apiClient.defaults.adapter` — a function adapter installed per run that
 *      counts protected-request attempts, records the outgoing `Authorization`
 *      header on each attempt, and scripts the status sequence (401 then 200 for
 *      the success scenario; 401 on the only attempt for the failure scenario).
 *      Axios's own `settle` turns the 401 response into a rejected `AxiosError`
 *      carrying the response, which is exactly what the response interceptor
 *      reacts to — so we exercise the REAL handler faithfully.
 *
 *   2. `jest.spyOn(axios, 'post')` — stubs the bare refresh call so it resolves
 *      `{ data: { accessToken: NEW } }` (success) or rejects (failure), while
 *      counting how many times refresh is attempted.
 *
 * The Auth_Store is seeded via `setSession` (its real persistence path runs
 * against the in-memory `expo-secure-store` mock from jest.setup.js). The
 * adapter, the axios spy, the counters, and the in-flight refresh promise are
 * reset inside every fast-check execution so runs are fully independent. The
 * single property branches on a generated `refreshSucceeds` boolean so BOTH the
 * success (one refresh + one retry with the new token) and the failure (clear
 * session, no infinite loop) behaviors of Property 5 are exercised by one
 * property-based test.
 */

import fc from 'fast-check';
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { AuthUser } from '../../api/types';

// Speed (user override): keep iterations modest and overridable via env.
const NUM_RUNS = Number(process.env.FC_NUM_RUNS) || 20;

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Token-like strings drawn from a base64url-ish charset. Constrained to a safe
 * alphabet so each value can always be set as an HTTP header value (no control
 * characters) while still varying widely across runs.
 */
const TOKEN_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._'.split('');
const tokenArb = fc.stringOf(fc.constantFrom(...TOKEN_CHARS), {
  minLength: 1,
  maxLength: 64,
});

/** Varying success payloads returned by the retried protected request. */
const payloadArb = fc.record({
  data: fc.array(fc.record({ id: fc.uuid(), title: fc.string() }), { maxLength: 5 }),
  total: fc.nat(),
  page: fc.nat(),
  limit: fc.integer({ min: 1, max: 100 }),
});

const USER: AuthUser = {
  id: 'user-1',
  phoneNumber: '09123456789',
  avatar: null,
  role: 'user',
  isSubscribed: false,
  subscriptionExpiresAt: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a well-formed AxiosResponse for the adapter to resolve with. */
function makeResponse(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown
): AxiosResponse {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Unauthorized',
    headers: {},
    config,
    request: {},
  } as AxiosResponse;
}

/** Read the (case-insensitive) Authorization header off a request config. */
function readAuthHeader(config: InternalAxiosRequestConfig): string | undefined {
  const headers = config.headers as unknown as {
    get?: (name: string) => unknown;
    Authorization?: unknown;
    authorization?: unknown;
  };
  if (!headers) {
    return undefined;
  }
  if (typeof headers.get === 'function') {
    const value = headers.get('Authorization');
    return value == null ? undefined : String(value);
  }
  const raw = headers.Authorization ?? headers.authorization;
  return raw == null ? undefined : String(raw);
}

describe('Property 5: single 401 -> exactly one refresh + one retry with the new token', () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(async () => {
    apiClient.defaults.adapter = originalAdapter;
    jest.restoreAllMocks();
    await useAuthStore.getState().clearSession();
  });

  // Feature: employment-frontend, Property 5: A single 401 triggers exactly one refresh and one retry with the new token
  // 
  it('refreshes once and retries once with the NEW token on success; clears session without looping on refresh failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        tokenArb,
        tokenArb,
        payloadArb,
        fc.boolean(),
        async (oldToken, newToken, refreshToken, payload, refreshSucceeds) => {
          // Make OLD and NEW distinguishable so "retried with the NEW token" is
          // a meaningful assertion.
          fc.pre(oldToken !== newToken);

          let adapterCalls = 0;
          const seenAuth: Array<string | undefined> = [];

          // Protected request: 401 on the first attempt. On the retry (only
          // reached when refresh succeeds) it returns 200 with the payload.
          //
          // A custom function adapter is responsible for axios's `settle`
          // semantics: the built-in adapters reject non-2xx responses via
          // `validateStatus`, but a function adapter must do so itself. So we
          // resolve 2xx responses and reject non-2xx ones as an `AxiosError`
          // carrying the response — exactly what the response interceptor's
          // rejection handler reacts to.
          apiClient.defaults.adapter = async (config) => {
            adapterCalls += 1;
            seenAuth.push(readAuthHeader(config));
            const isFirst = adapterCalls === 1;
            const status = isFirst ? 401 : 200;
            const response = makeResponse(
              config,
              status,
              isFirst ? { message: 'Unauthorized' } : payload
            );
            if (status >= 200 && status < 300) {
              return response;
            }
            throw new axios.AxiosError(
              `Request failed with status code ${status}`,
              axios.AxiosError.ERR_BAD_REQUEST,
              config,
              response.request,
              response
            );
          };

          // Bare refresh call: resolves with ONLY a new access token, or rejects.
          let refreshCalls = 0;
          const postSpy = jest.spyOn(axios, 'post').mockImplementation(async () => {
            refreshCalls += 1;
            if (!refreshSucceeds) {
              throw new Error('refresh failed');
            }
            return {
              data: { accessToken: newToken },
              status: 200,
              statusText: 'OK',
              headers: {},
              config: {},
            } as AxiosResponse;
          });

          await useAuthStore
            .getState()
            .setSession({ accessToken: oldToken, refreshToken, user: USER });

          try {
            if (refreshSucceeds) {
              const res = await apiClient.get('/favorites');

              // Exactly one refresh.
              expect(refreshCalls).toBe(1);
              // Exactly one retry => the protected request hit the adapter twice.
              expect(adapterCalls).toBe(2);
              // First attempt carried the OLD token; the retry carried the NEW one.
              expect(seenAuth[0]).toBe(`Bearer ${oldToken}`);
              expect(seenAuth[1]).toBe(`Bearer ${newToken}`);
              // Resolves with the success payload.
              expect(res.data).toEqual(payload);
              // Store now holds the new access token; refresh token is reused.
              expect(useAuthStore.getState().accessToken).toBe(newToken);
              expect(useAuthStore.getState().refreshToken).toBe(refreshToken);
              expect(useAuthStore.getState().status).toBe('authenticated');
            } else {
              // The original promise rejects with a structured ApiError.
              await expect(apiClient.get('/favorites')).rejects.toBeDefined();

              // Refresh attempted exactly once; the original request was NOT
              // replayed in an infinite loop (one initial attempt, no retry).
              expect(refreshCalls).toBe(1);
              expect(adapterCalls).toBe(1);

              // Session fully cleared and marked unauthenticated.
              const state = useAuthStore.getState();
              expect(state.accessToken).toBeNull();
              expect(state.refreshToken).toBeNull();
              expect(state.user).toBeNull();
              expect(state.status).toBe('unauthenticated');
            }
          } finally {
            postSpy.mockRestore();
            await useAuthStore.getState().clearSession();
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
