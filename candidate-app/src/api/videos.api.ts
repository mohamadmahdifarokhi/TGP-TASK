/**
 * Videos resource module.
 *
 * Typed functions for the JamJoys videos endpoints. Calls route through the
 * shared {@link request} helper so failures surface as a structured `ApiError`
 * and the 401 refresh/retry interceptor applies uniformly.
 * Each function returns the parsed `response.data`.
 *
 * Routes (targeted exactly as published
 * - `get`            → `GET /videos/:id`                  (public)
 * - `validateAccess` → `GET /videos/:id/validate-access`  (auth required)
 * - `stream`         → `GET /videos/:id/stream`           (auth required)
 *
 */

import { request } from './client';
import type { ValidateAccessRes, Video } from './types';

/** `GET /videos/:id` — load video metadata. */
export async function get(id: string): Promise<Video> {
  const res = await request<Video>({
    method: 'GET',
    url: `/videos/${encodeURIComponent(id)}`,
  });
  return res.data;
}

/**
 * `GET /videos/:id/validate-access` — check whether the current user may play
 * the video. Returns `{ hasAccess, message }`.
 */
export async function validateAccess(id: string): Promise<ValidateAccessRes> {
  const res = await request<ValidateAccessRes>({
    method: 'GET',
    url: `/videos/${encodeURIComponent(id)}/validate-access`,
  });
  return res.data;
}

/**
 * `GET /videos/:id/stream` — fetch stream information for the video.
 *
 * The backend stream payload shape is not part of the assignment contract, so
 * it is returned untyped (`unknown`) for the caller to interpret.
 */
export async function stream(id: string): Promise<unknown> {
  const res = await request<unknown>({
    method: 'GET',
    url: `/videos/${encodeURIComponent(id)}/stream`,
  });
  return res.data;
}

export const videosApi = { get, validateAccess, stream };

export default videosApi;
