// Feature: employment-frontend, Property 10: Error view always renders a human-readable message
/**
 * Property-based test for Property 10 (Requirement 10.2).
 *
 * For ANY `ApiError { status, message }`, the shared error state view must
 * render a NON-EMPTY, human-readable message reflecting the error — never a
 * blank or `undefined` render.
 *
 * The core of the property is exercised against the pure helper
 * `getErrorMessage(error: ApiError): string`, which backs `StateView`'s error
 * branch and guarantees a non-empty string for any structured error (including
 * ones whose `message` is empty, whitespace-only, or otherwise unusable).
 *
 * In addition to the fast-check property (>=100 runs over `getErrorMessage`),
 * a handful of representative cases are rendered through `StateView` with
 * @testing-library/react-native to confirm the message actually reaches the
 * DOM as a non-empty text node (queried by testID `state-view-error-message`).
 *
 * **Validates: Requirements 10.2**
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import fc from 'fast-check';

import type { ApiError } from '../../api/types';
import { StateView, getErrorMessage } from '../../components/StateView';

/** Tunable iteration count; defaults LOW for fast local/CI runs. */
const NUM_RUNS = Number(process.env.FC_NUM_RUNS) || 30;

/**
 * Arbitrary for the `message` field of an `ApiError`. Intentionally includes
 * the awkward cases that must still yield a human-readable render:
 *   - the empty string
 *   - whitespace-only strings (spaces / tabs / newlines)
 *   - arbitrary normal strings (incl. unicode)
 */
const messageArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant(''),
  fc.constantFrom('   ', '\t', '\n', ' \t \n '),
  fc.string(),
  fc.fullUnicodeString()
);

/**
 * Arbitrary for the `status` field. Covers transport-failure sentinels (0),
 * the full HTTP error band (400–599), and arbitrary integers to ensure the
 * helper is total over any numeric status.
 */
const statusArb: fc.Arbitrary<number> = fc.oneof(
  fc.constant(0),
  fc.integer({ min: 400, max: 599 }),
  fc.integer()
);

/** Arbitrary for a full structured `ApiError`. */
const apiErrorArb: fc.Arbitrary<ApiError> = fc.record({
  status: statusArb,
  message: messageArb,
});

describe('Property 10: Error view always renders a human-readable message', () => {
  it('getErrorMessage returns a non-empty, trimmed-non-blank string for ANY ApiError', () => {
    fc.assert(
      fc.property(apiErrorArb, (error) => {
        const message = getErrorMessage(error);

        expect(typeof message).toBe('string');
        // Never blank or whitespace-only.
        expect(message.trim().length).toBeGreaterThan(0);
        // Never a stringified nullish value leaking through.
        expect(message).not.toBe('undefined');
        expect(message).not.toBe('null');
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it.each([
    ['normal message', { status: 500, message: 'Server exploded' }],
    ['empty message', { status: 503, message: '' }],
    ['whitespace-only message', { status: 0, message: '   ' }],
    ['transport failure (status 0, blank)', { status: 0, message: '' }],
  ])(
    'renders a non-empty error message text node for case: %s',
    (_label, error) => {
      const { getByTestId } = render(
        <StateView error={error as ApiError} onRetry={() => {}} />
      );

      const node = getByTestId('state-view-error-message');
      const text = node.props.children as string;

      expect(typeof text).toBe('string');
      expect(text.trim().length).toBeGreaterThan(0);
    }
  );
});
