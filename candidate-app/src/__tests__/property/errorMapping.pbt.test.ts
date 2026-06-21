// Feature: employment-frontend, Property 2: Non-2xx responses become structured errors
/**
 * Property-based test for Property 2.
 *
 * For ANY HTTP status code in the 400–599 range and ANY backend response body,
 * the API client's error translator (`toApiError`, exported from
 * `src/api/client.ts`) returns a structured `ApiError` whose `status` equals
 * the response status and whose `message` is a non-empty string derived from
 * the body.
 *
 * The transport (axios) is never exercised: we construct a synthetic
 * axios-like error object (`{ isAxiosError: true, response: { status, data },
 * message }`) so the property tests the pure mapping logic, not the network.
 *
 
 */
import fc from 'fast-check';
import type { AxiosError } from 'axios';

import { toApiError } from '../../api/client';

/**
 * Speed override (user-requested): default to a small number of runs so the
 * suite stays fast, while still allowing a heavier run via the environment
 * variable `FC_NUM_RUNS`.
 */
const NUM_RUNS = Number(process.env.FC_NUM_RUNS) || 30;

/**
 * Arbitrary for the varied backend response bodies a real API might return on a
 * non-2xx response: `{ message: string }`, `{ message: string[] }`,
 * `{ error: string }`, a plain string body, or an arbitrary object.
 */
const responseBodyArb: fc.Arbitrary<unknown> = fc.oneof(
  fc.record({ message: fc.string() }),
  fc.record({ message: fc.array(fc.string()) }),
  fc.record({ error: fc.string() }),
  fc.string(),
  fc.object()
);

/**
 * Build a synthetic axios-like error carrying a received HTTP response.
 * Shape mirrors what axios produces for a non-2xx response:
 * `{ isAxiosError: true, response: { status, data }, message }`.
 */
function makeAxiosLikeError(
  status: number,
  data: unknown,
  message: string
): AxiosError {
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message,
    toJSON: () => ({}),
    config: undefined as never,
    response: {
      status,
      statusText: '',
      data,
      headers: {},
      config: undefined as never,
    },
  } as unknown as AxiosError;
}

describe('Property 2: Non-2xx responses become structured errors', () => {
  it('maps any 400–599 response with any body to an ApiError with matching status and non-empty message', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 599 }),
        responseBodyArb,
        fc.string(),
        (status, data, axiosMessage) => {
          const err = makeAxiosLikeError(status, data, axiosMessage);

          const result = toApiError(err);

          // status must equal the response status exactly
          expect(result.status).toBe(status);
          // message must be a non-empty string derived from the body/error
          expect(typeof result.message).toBe('string');
          expect(result.message.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
