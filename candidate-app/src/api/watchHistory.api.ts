/**
 * Watch-history resource module.
 *
 * Typed functions for the JamJoys watch-history endpoints. Calls route through
 * the shared {@link request} helper so failures surface as a structured
 * `ApiError` (Requirement 2.3) and the 401 refresh/retry interceptor applies
 * uniformly. Each function returns the parsed `response.data`.
 *
 * Routes (targeted exactly as published — Requirement 2.6):
 * - `list`   → `GET  /watch-history`
 * - `record` → `POST /watch-history/:videoId`
 *
 * Requirements: 2.5, 2.6, 7.4, 7.5
 */

import { request } from './client';
import type { WatchHistoryItem } from './types';

/** `GET /watch-history` — previously watched videos. */
export async function list(): Promise<WatchHistoryItem[]> {
  const res = await request<WatchHistoryItem[]>({
    method: 'GET',
    url: '/watch-history',
  });
  return res.data;
}

/**
 * `POST /watch-history/:videoId` — record playback progress for a video.
 *
 * `progress` (when provided) is sent in the request body so the backend can
 * persist the user's resume position.
 */
export async function record(
  videoId: string,
  progress?: number
): Promise<WatchHistoryItem> {
  const res = await request<WatchHistoryItem>({
    method: 'POST',
    url: `/watch-history/${encodeURIComponent(videoId)}`,
    data: progress === undefined ? undefined : { progress },
  });
  return res.data;
}

export const watchHistoryApi = { list, record };

export default watchHistoryApi;
