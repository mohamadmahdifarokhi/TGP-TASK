// Feature: employment-frontend, Property 8: Video playback is gated strictly by access
/**
 * Property-based test for Property 8.
 *
 * For ANY `validate-access` response `{ hasAccess, message }`, playback begins
 * IF AND ONLY IF `hasAccess === true`. When `hasAccess` is false the player
 * must not start and the backend-provided explanatory `message` is surfaced;
 * when `hasAccess` is true there is nothing to explain and the message is
 * `null`.
 *
 * The helpers under test are pure (`src/utils/videoAccess.ts`), so we exercise
 * the playback decision across arbitrary booleans and arbitrary messages with
 * no I/O mocking required.
 *
 
 */
import fc from 'fast-check';

import { canPlay, accessGate } from '../../utils/videoAccess';
import type { ValidateAccessRes } from '../../api/types';

// Speed override: keep the run count small by default, but allow it to be
// tuned via the FC_NUM_RUNS environment variable.
const NUM_RUNS = Number(process.env.FC_NUM_RUNS) || 30;

/** Arbitrary for a well-typed `{ hasAccess: boolean, message: string }` response. */
const accessArb: fc.Arbitrary<ValidateAccessRes> = fc.record({
  hasAccess: fc.boolean(),
  message: fc.string(),
});

describe('Property 8: Video playback is gated strictly by access', () => {
  it('canPlay(access) is true iff access.hasAccess === true', () => {
    fc.assert(
      fc.property(accessArb, (access) => {
        expect(canPlay(access)).toBe(access.hasAccess);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('accessGate gates playback strictly by access and surfaces the message only when denied', () => {
    fc.assert(
      fc.property(accessArb, (access) => {
        const gate = accessGate(access);

        // Playback begins iff hasAccess is true.
        expect(gate.canPlay).toBe(access.hasAccess);

        if (access.hasAccess) {
          // Granted: player starts, nothing to explain.
          expect(gate.message).toBeNull();
        } else {
          // Denied: player does not start, explanatory message is surfaced.
          expect(gate.message).toBe(access.message);
        }
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
