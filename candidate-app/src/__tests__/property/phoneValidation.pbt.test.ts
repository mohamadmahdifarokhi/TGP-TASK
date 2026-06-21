// Feature: employment-frontend, Property 3: Phone validation gates the backend call
/**
 * Property-based test for Property 3.
 *
 * For ANY input string, the sign-in flow calls `send-otp` IF AND ONLY IF the
 * string matches the canonical Iranian mobile format (`^09\d{9}$`); for every
 * non-matching string it makes NO backend call.
 *
 * The screen itself is not pure, so we test the gating logic directly. We model
 * the gate as a tiny pure function `attemptSendOtp(input, sendFn)` that invokes
 * `sendFn` only when `isValidIranPhone(input)` is true. For each generated input
 * we assert that `sendFn` was called exactly when `isValidIranPhone(input)` is
 * true (the IFF), and we cross-check `isValidIranPhone` against the canonical
 * regex `^09\d{9}$`.
 *
 * Generators mix (a) constructed valid canonical numbers (`09` + 9 digits) with
 * (b) arbitrary strings (mostly invalid), so BOTH branches of the gate — call
 * vs. no call — are exercised across runs.
 *
 
 */
import fc from 'fast-check';

import { isValidIranPhone } from '../../utils/phone';

/** The canonical Iranian mobile format the backend accepts (`^09\d{9}$`). */
const CANONICAL = /^09\d{9}$/;

/**
 * The gate under test: calls `sendFn(input)` IF AND ONLY IF `input` is a valid
 * canonical Iranian phone number. Mirrors how the sign-in screen gates the
 * `POST /auth/send-otp` backend call behind validation.
 */
function attemptSendOtp(input: string, sendFn: (phone: string) => void): void {
  if (isValidIranPhone(input)) {
    sendFn(input);
  }
}

/** Arbitrary that always produces a valid canonical number: `09` + 9 digits. */
const validIranPhone: fc.Arbitrary<string> = fc
  .array(fc.integer({ min: 0, max: 9 }), { minLength: 9, maxLength: 9 })
  .map((digits) => '09' + digits.join(''));

/** Mixed input arbitrary: arbitrary strings plus constructed valid numbers. */
const mixedInput: fc.Arbitrary<string> = fc.oneof(fc.string(), validIranPhone);

// User override for speed: runs default to 30, configurable via FC_NUM_RUNS.
const NUM_RUNS = Number(process.env.FC_NUM_RUNS) || 30;

describe('Property 3: Phone validation gates the backend call', () => {
  it('invokes the send-otp function IF AND ONLY IF the input matches ^09\\d{9}$', () => {
    fc.assert(
      fc.property(mixedInput, (input) => {
        const valid = isValidIranPhone(input);

        // The validator agrees exactly with the canonical regex (the IFF basis).
        expect(valid).toBe(CANONICAL.test(input));

        // Simulate the gate with a mock send function.
        let calls = 0;
        let lastArg: string | undefined;
        const sendFn = (phone: string): void => {
          calls += 1;
          lastArg = phone;
        };

        attemptSendOtp(input, sendFn);

        // The backend call happens exactly when the phone is valid.
        expect(calls === 1).toBe(valid);
        if (valid) {
          expect(lastArg).toBe(input);
        }
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('always invokes send-otp for generated canonical numbers', () => {
    fc.assert(
      fc.property(validIranPhone, (phone) => {
        let called = false;
        attemptSendOtp(phone, () => {
          called = true;
        });
        expect(isValidIranPhone(phone)).toBe(true);
        expect(called).toBe(true);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
