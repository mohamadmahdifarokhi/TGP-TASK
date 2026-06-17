/**
 * SUPPLEMENTARY live-backend integration test (Task 9.8, Requirement 2.6).
 *
 * This is a thin, real-network smoke test that exercises the OTP happy path
 * against a *locally running* JamJoys backend to verify real wiring and route
 * correctness end-to-end:
 *
 *   POST /auth/send-otp   (read the dev `otp` returned in the response)
 *     -> POST /auth/verify-otp   (obtain access + refresh tokens)
 *       -> seed the Auth_Store with the session
 *         -> GET /auth/me   (Bearer token attached by the API client)
 *   (optional) GET /games   to confirm the catalog endpoint shape.
 *
 * It uses the *real* `auth.api` / `games.api` functions, which issue axios
 * requests through the centralized client against `API_BASE_URL`.
 *
 * --------------------------------------------------------------------------
 * GUARD: this suite is SKIPPED by default.
 * --------------------------------------------------------------------------
 * It makes real network calls, so it must NOT run (or fail) during a normal
 * `npm test` / CI run where no backend is present. The whole suite is gated
 * behind an explicit env flag and uses `describe.skip` when the flag is absent.
 *
 * How to run it (with the JamJoys backend running, e.g. on http://localhost:3000):
 *
 *   RUN_INTEGRATION=1 npx jest src/__tests__/integration
 *
 * Optionally point it at a non-default backend (this also enables the suite):
 *
 *   RUN_INTEGRATION_BASE_URL=http://192.168.1.10:3000 npx jest src/__tests__/integration
 *
 * Optionally override the test phone number (defaults to a valid 09xxxxxxxxx):
 *
 *   RUN_INTEGRATION=1 RUN_INTEGRATION_PHONE=09120000000 npx jest src/__tests__/integration
 */

// Enable only when explicitly requested via env. When neither flag is set the
// suite is registered with `describe.skip`, so a default run reports it as
// skipped (never failed) and performs zero network calls.
const shouldRun =
  process.env.RUN_INTEGRATION === '1' || !!process.env.RUN_INTEGRATION_BASE_URL;

const describeIntegration = shouldRun ? describe : describe.skip;

// A valid Iranian mobile number (^09\d{9}$). The dev backend accepts any
// well-formed number and returns the generated OTP in the send-otp response.
const TEST_PHONE = process.env.RUN_INTEGRATION_PHONE ?? '09120000000';

// Real network round-trips can be slow; give each test generous headroom.
const NETWORK_TIMEOUT_MS = 30000;

describeIntegration('auth integration (live backend)', () => {
  // Lazily required so the optional RUN_INTEGRATION_BASE_URL override is applied
  // to the environment BEFORE the config/client modules read API_BASE_URL.
  let authApi: typeof import('../../api/auth.api');
  let gamesApi: typeof import('../../api/games.api');
  let useAuthStore: typeof import('../../store/authStore').useAuthStore;

  beforeAll(() => {
    if (process.env.RUN_INTEGRATION_BASE_URL) {
      // The config module reads EXPO_PUBLIC_API_BASE_URL at import time; set it
      // first so the client targets the requested backend.
      process.env.EXPO_PUBLIC_API_BASE_URL = process.env.RUN_INTEGRATION_BASE_URL;
    }
    authApi = require('../../api/auth.api');
    gamesApi = require('../../api/games.api');
    useAuthStore = require('../../store/authStore').useAuthStore;
  });

  afterEach(async () => {
    // Leave no session behind between examples.
    await useAuthStore.getState().clearSession();
  });

  it(
    'completes the OTP happy path: send-otp -> verify-otp -> GET /auth/me',
    async () => {
      // 1) Request an OTP. In dev the backend returns the code in the response.
      const sent = await authApi.sendOtp(TEST_PHONE);
      expect(sent.phoneNumber).toBe(TEST_PHONE);
      expect(typeof sent.otp).toBe('string');
      expect(sent.otp).toMatch(/^\d{6}$/);

      // 2) Verify the OTP to obtain a real session.
      const session = await authApi.verifyOtp(TEST_PHONE, sent.otp as string);
      expect(session.accessToken).toBeTruthy();
      expect(session.refreshToken).toBeTruthy();
      expect(session.user.phoneNumber).toBe(TEST_PHONE);

      // 3) Seed the Auth_Store so the request interceptor attaches the Bearer
      //    token, then fetch the current user from the protected endpoint.
      await useAuthStore.getState().setSession({
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });

      const me = await authApi.me();
      expect(me.id).toBe(session.user.id);
      expect(me.phoneNumber).toBe(TEST_PHONE);
    },
    NETWORK_TIMEOUT_MS
  );

  it(
    'fetches the games catalog (endpoint shape sanity check)',
    async () => {
      const result = await gamesApi.list({ page: 1, limit: 5 });

      // The backend may return either a paginated envelope or a bare array.
      const games = Array.isArray(result) ? result : result.data;
      expect(Array.isArray(games)).toBe(true);
    },
    NETWORK_TIMEOUT_MS
  );
});
