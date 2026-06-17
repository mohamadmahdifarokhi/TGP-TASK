/**
 * Pure video access-gate logic.
 *
 * The backend `GET /videos/:id/validate-access` endpoint returns
 * `{ hasAccess: boolean, message: string }`. Playback may begin **if and only
 * if** `hasAccess` is true; when access is denied the explanatory `message`
 * is surfaced to the user instead (Requirements 7.2, 7.3 — backs Property 8).
 *
 * These helpers are intentionally pure (no I/O, no side effects) so the
 * playback decision can be tested exhaustively across all inputs.
 */

import type { ValidateAccessRes } from '../api/types';

/**
 * The result of evaluating an access-gate decision.
 */
export type AccessGate = {
  /** Whether video playback may begin. */
  canPlay: boolean;
  /**
   * The explanatory message to show when playback is blocked, or `null` when
   * playback is allowed (nothing to explain).
   */
  message: string | null;
};

/**
 * Decide whether playback may start for a given `validate-access` response.
 *
 * Playback begins strictly when `hasAccess === true`. Any other value
 * (including a falsy/missing flag) blocks playback.
 *
 * @param access The `{ hasAccess, message }` response from `validate-access`.
 * @returns `true` if playback may begin, otherwise `false`.
 */
export function canPlay(access: ValidateAccessRes): boolean {
  return access.hasAccess === true;
}

/**
 * Evaluate the full access-gate decision: whether playback may start and, when
 * it may not, the explanatory message to display.
 *
 * When access is granted the message is `null` (there is nothing to explain).
 * When access is denied the backend-provided `message` is returned so the UI
 * can tell the user why playback is unavailable.
 *
 * @param access The `{ hasAccess, message }` response from `validate-access`.
 * @returns An {@link AccessGate} describing the playback decision.
 */
export function accessGate(access: ValidateAccessRes): AccessGate {
  if (canPlay(access)) {
    return { canPlay: true, message: null };
  }
  return { canPlay: false, message: access.message };
}

export default accessGate;
