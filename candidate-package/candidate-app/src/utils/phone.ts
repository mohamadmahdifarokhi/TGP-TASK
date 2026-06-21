/**
 * Iranian mobile phone validation and normalization utilities.
 *
 * These are pure functions (no side effects, no I/O) used by the sign-in flow
 * to gate the `POST /auth/send-otp` backend call.
 *
 * Canonical form accepted by the backend: `^09\d{9}$` (e.g. `09123456789`).
 */

import { IRAN_PHONE_REGEX } from '@/config';

/**
 * Returns `true` if and only if `input` is exactly the canonical Iranian mobile
 * format `09` followed by 9 digits (`^09\d{9}$`).
 *
 * This performs NO normalization — it is a strict check against the canonical
 * form so callers can validate already-normalized input.
 *
 * @param input - The raw string to validate.
 * @returns `true` when `input` matches `^09\d{9}$`, otherwise `false`.
 */
export function isValidIranPhone(input: string): boolean {
  // Guard against non-string runtime values without throwing.
  if (typeof input !== 'string') {
    return false;
  }
  return IRAN_PHONE_REGEX.test(input);
}

/**
 * Attempts to normalize a loosely-formatted Iranian mobile number to the
 * canonical `09xxxxxxxxx` form.
 *
 * Normalization steps (all pure, order-independent of side effects):
 *  1. Strip spaces, dashes, dots, and parentheses (common visual separators).
 *  2. Convert a leading international prefix to the national `0` form:
 *       - `+98xxxxxxxxxx`  -> `0xxxxxxxxxx`
 *       - `0098xxxxxxxxxx` -> `0xxxxxxxxxx`
 *       - `98xxxxxxxxxx`   -> `0xxxxxxxxxx`
 *  3. Validate the result against the canonical `^09\d{9}$` form.
 *
 * @param input - The raw, possibly-formatted phone string.
 * @returns The canonical `09xxxxxxxxx` string when the normalized result is
 *          valid, otherwise `null`.
 */
export function normalizeIranPhone(input: string): string | null {
  if (typeof input !== 'string') {
    return null;
  }

  // 1. Remove common visual separators (spaces, dashes, dots, parentheses).
  let digits = input.replace(/[\s().-]/g, '');

  // 2. Normalize international prefixes to the national `0` form.
  if (digits.startsWith('+98')) {
    digits = '0' + digits.slice(3);
  } else if (digits.startsWith('0098')) {
    digits = '0' + digits.slice(4);
  } else if (digits.startsWith('98')) {
    digits = '0' + digits.slice(2);
  }

  // 3. Only return the normalized value when it is canonically valid.
  return isValidIranPhone(digits) ? digits : null;
}
