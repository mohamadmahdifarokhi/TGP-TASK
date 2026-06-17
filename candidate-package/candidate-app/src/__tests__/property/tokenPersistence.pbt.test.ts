// Feature: employment-frontend, Property 4: Token persistence round-trips and restores the session
/**
 * Property-based test for Auth_Store token persistence round-trip.
 *
 * Property 4 (design.md): For ANY access token, refresh token, and user object,
 * persisting them to device storage (via setSession) and then rehydrating the
 * Auth_Store on a fresh launch (hydrate) yields identical tokens and user and a
 * status of 'authenticated'.
 *
 * Validates: Requirements 4.2, 4.3
 *
 * expo-secure-store is mocked in jest.setup.js with an in-memory Map that
 * persists across calls within a single test (the beforeEach reset only fires
 * between tests, not between fast-check iterations). To emulate a cold start we
 * reset ONLY the in-memory zustand state (NOT the secure store) and then call
 * hydrate(). Each iteration is self-contained because setSession overwrites all
 * three persisted keys, replacing any value left by a prior iteration. So the
 * full set + relaunch + hydrate cycle happens within a single test iteration.
 */

import fc from 'fast-check';

import { useAuthStore } from '../../store/authStore';
import type { AuthUser } from '../../api/types';

// Speed override: keep the default run count modest so the suite stays fast,
// while allowing a deeper sweep via the FC_NUM_RUNS environment variable.
const NUM_RUNS = Number(process.env.FC_NUM_RUNS) || 20;

/** Generator for an AuthUser-ish object matching the type shape. */
const userArb: fc.Arbitrary<AuthUser> = fc.record({
  id: fc.string({ minLength: 1 }),
  // phoneNumber matches the canonical Iranian mobile format: 09 + 9 digits.
  phoneNumber: fc.stringMatching(/^[0-9]{9}$/).map((digits) => `09${digits}`),
  avatar: fc.option(fc.string(), { nil: null }),
  role: fc.string({ minLength: 1 }),
  isSubscribed: fc.boolean(),
  subscriptionExpiresAt: fc.option(fc.string(), { nil: null }),
});

describe('Property 4: Token persistence round-trips and restores the session', () => {
  it('persists a session then restores identical tokens/user with status authenticated on a fresh launch', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // access token (non-empty)
        fc.string({ minLength: 1 }), // refresh token (non-empty)
        userArb,
        async (accessToken, refreshToken, user) => {
          // 1) Persist the session to the (mocked) secure store. setSession
          //    writes all three keys, so this fully replaces any prior
          //    iteration's persisted values without clearing secure storage.
          await useAuthStore.getState().setSession({ accessToken, refreshToken, user });

          // 2) Emulate a cold start: drop the in-memory state WITHOUT clearing
          //    the secure store, so persistence must survive the relaunch.
          useAuthStore.setState({
            accessToken: null,
            refreshToken: null,
            user: null,
            status: 'unknown',
          });

          // 3) Rehydrate from persisted storage.
          await useAuthStore.getState().hydrate();

          // 4) The round-trip must restore everything exactly.
          const state = useAuthStore.getState();
          expect(state.accessToken).toBe(accessToken);
          expect(state.refreshToken).toBe(refreshToken);
          expect(state.user).toEqual(user);
          expect(state.status).toBe('authenticated');
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});
