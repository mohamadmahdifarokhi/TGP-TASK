// Feature: employment-frontend, Property 1: Bearer header is well-formed for any token
/**
 * Property 1: Bearer header is well-formed for any token.
 *
 * For ANY non-empty access-token string, when the API client issues a protected
 * request, the outgoing `Authorization` header equals exactly `Bearer ${token}`
 * (a single space, the unmodified token).
 *
 * Strategy: exercise the REAL request interceptor registered on the shared
 * `apiClient` from `src/api/client.ts`. axios stores each registered request
 * interceptor as `{ fulfilled, rejected }` on
 * `apiClient.interceptors.request.handlers`; we capture the registered
 * `fulfilled` handler (the one that reads `useAuthStore.getState().accessToken`
 * and attaches the header) and apply it to a minimal config carrying an
 * `AxiosHeaders` instance — exactly what axios passes it at request time. For
 * each generated token we seed the Auth_Store, run the handler, and assert the
 * resulting `Authorization` header equals exactly `Bearer ${token}`.
 *
 * `expo-secure-store` is mocked in-memory globally via jest.setup.js, so seeding
 * the store through `setAccessToken` never touches native storage.
 *
 * Speed: iteration count is tunable via `FC_NUM_RUNS` and defaults LOW so the
 * suite stays fast; override with `FC_NUM_RUNS=200 npm test` for deeper runs.
 *
 
 */
import fc from 'fast-check';
import {
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';

import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

/** Tunable iteration count; defaults LOW for fast local/CI runs. */
const NUM_RUNS = Number(process.env.FC_NUM_RUNS) || 30;

/**
 * The fulfilled request-interceptor handler registered by `src/api/client.ts`.
 * axios exposes registered interceptors on `.handlers`; entries may be `null`
 * if an interceptor was ejected, so we pick the first live `fulfilled` handler.
 */
type RequestFulfilled = (
  config: InternalAxiosRequestConfig
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;

function getRequestInterceptor(): RequestFulfilled {
  const handlers = (
    apiClient.interceptors.request as unknown as {
      handlers: Array<{ fulfilled?: RequestFulfilled } | null>;
    }
  ).handlers;

  const handler = handlers.find(
    (h): h is { fulfilled: RequestFulfilled } =>
      h != null && typeof h.fulfilled === 'function'
  );

  if (!handler) {
    throw new Error('No request interceptor registered on apiClient');
  }
  return handler.fulfilled;
}

/** Read the Authorization header off an AxiosHeaders-bearing config. */
function readAuthHeader(config: InternalAxiosRequestConfig): string | undefined {
  const value = config.headers.get('Authorization');
  return value == null ? undefined : String(value);
}

/** Build a minimal request config with a real AxiosHeaders instance. */
function makeConfig(): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
    method: 'get',
    url: '/protected',
  } as InternalAxiosRequestConfig;
}

describe('Property 1: Bearer header is well-formed for any token', () => {
  afterEach(async () => {
    await useAuthStore.getState().clearSession();
  });

  it('produces exactly `Bearer ${token}` for any non-empty access token', async () => {
    const requestInterceptor = getRequestInterceptor();

    await fc.assert(
      fc.asyncProperty(
        // Non-empty tokens. Exclude CR/LF (invalid HTTP header characters) and
        // leading/trailing whitespace, which AxiosHeaders normalizes away — real
        // access tokens (JWTs) never carry surrounding whitespace.
        fc
          .string({ minLength: 1 })
          .filter((s) => s.trim() === s && s.length > 0 && !/[\r\n]/.test(s)),
        async (token) => {
          // Seed the store with the generated access token. setAccessToken
          // persists to the in-memory secure-store mock and updates state, so
          // the interceptor reads it back via useAuthStore.getState().
          await useAuthStore.getState().setAccessToken(token);

          // Run the real interceptor against a fresh config.
          const config = await requestInterceptor(makeConfig());

          // The header must be exactly `Bearer ${token}`: a single space and
          // the unmodified token, with no extra trimming or transformation.
          expect(readAuthHeader(config)).toBe(`Bearer ${token}`);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
