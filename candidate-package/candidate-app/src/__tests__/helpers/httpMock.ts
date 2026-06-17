/**
 * In-memory HTTP transport mock.
 *
 * A generic, transport-agnostic stub that tests use to script HTTP responses
 * without hitting the network. The real API client (axios instance + resource
 * modules) is built in a later task, so this helper deliberately models only the
 * minimal request/response contract both axios and fetch can be adapted to:
 *
 *   - a request is identified by `${method} ${url}` (method is upper-cased)
 *   - a response carries a numeric `status` and an arbitrary JSON `data` body
 *   - non-2xx statuses are still returned (the API client decides how to map
 *     them into a structured `ApiError`); transport-level failures are modeled
 *     by queueing an `Error` instead of a response.
 *
 * Usage (per-test):
 *   const http = createHttpMock();
 *   http.on('GET', '/games', { status: 200, data: { data: [], total: 0 } });
 *   http.onError('POST', '/auth/refresh', new Error('Network down'));
 *   const res = await http.request({ method: 'get', url: '/games' });
 *   expect(http.calls).toHaveLength(1);
 */

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

export interface MockRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  data?: unknown;
}

export interface MockResponse<T = unknown> {
  status: number;
  data: T;
  headers?: Record<string, string>;
}

interface QueuedOutcome {
  /** Either a response to resolve with, or an error to reject with. */
  response?: MockResponse;
  error?: Error;
  /** When true the outcome is reusable; otherwise it is consumed once (FIFO). */
  persistent: boolean;
}

const key = (method: string, url: string): string =>
  `${String(method).toUpperCase()} ${url}`;

export interface HttpMock {
  /** Recorded requests, in the order they were issued. */
  readonly calls: MockRequest[];
  /**
   * Queue a response for a method+url. By default the response persists and is
   * returned for every matching request. Pass `{ once: true }` to enqueue a
   * one-shot response (consumed FIFO), enabling sequences like 401-then-200.
   */
  on<T = unknown>(
    method: HttpMethod,
    url: string,
    response: MockResponse<T>,
    opts?: { once?: boolean }
  ): HttpMock;
  /** Queue a transport-level failure (rejects the request). */
  onError(
    method: HttpMethod,
    url: string,
    error: Error,
    opts?: { once?: boolean }
  ): HttpMock;
  /**
   * Execute a request against the configured outcomes. Resolves with the scripted
   * MockResponse (including non-2xx) or rejects with the scripted error. Throws if
   * no outcome was configured for the request, so missing stubs fail loudly.
   */
  request<T = unknown>(req: MockRequest): Promise<MockResponse<T>>;
  /** Remove all recorded calls and queued outcomes. */
  reset(): void;
}

export function createHttpMock(): HttpMock {
  const calls: MockRequest[] = [];
  const outcomes = new Map<string, QueuedOutcome[]>();

  const enqueue = (k: string, outcome: QueuedOutcome): void => {
    const existing = outcomes.get(k);
    if (existing) {
      existing.push(outcome);
    } else {
      outcomes.set(k, [outcome]);
    }
  };

  const mock: HttpMock = {
    calls,

    on(method, url, response, opts) {
      enqueue(key(method, url), {
        response: response as MockResponse,
        persistent: !opts?.once,
      });
      return mock;
    },

    onError(method, url, error, opts) {
      enqueue(key(method, url), { error, persistent: !opts?.once });
      return mock;
    },

    async request<T = unknown>(req: MockRequest): Promise<MockResponse<T>> {
      calls.push(req);
      const k = key(req.method, req.url);
      const queue = outcomes.get(k);
      if (!queue || queue.length === 0) {
        throw new Error(`No mock outcome configured for "${k}"`);
      }

      // One-shot outcomes are consumed FIFO; a trailing persistent outcome is
      // reused once all one-shot outcomes ahead of it are exhausted.
      const outcome = queue.length > 1 && !queue[0].persistent ? queue.shift()! : queue[0];

      if (outcome.error) {
        throw outcome.error;
      }
      return outcome.response as MockResponse<T>;
    },

    reset() {
      calls.length = 0;
      outcomes.clear();
    },
  };

  return mock;
}
