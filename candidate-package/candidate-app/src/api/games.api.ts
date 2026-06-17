/**
 * Games resource module.
 *
 * Typed functions for the JamJoys games endpoints. Every call goes through the
 * shared {@link request} helper so failures surface as a structured `ApiError`
 * (Requirement 2.3) and the 401 refresh/retry interceptor applies uniformly.
 * Each function returns the parsed `response.data`.
 *
 * Routes (targeted exactly as published — Requirement 2.6):
 * - `list`           → `GET  /games`
 * - `featured`       → `GET  /games/featured`
 * - `getBySlugOrId`  → `GET  /games/:slugOrId`
 * - `recordView`     → `POST /games/:id/view`  (UUID id only — the backend route
 *                       uses `ParseUUIDPipe` + `OptionalJwtAuthGuard`)
 *
 * Requirements: 2.5, 2.6, 5.1, 6.1, 6.3
 */

import { request } from './client';
import type { Game, Paginated } from './types';

/** Optional query params accepted by `GET /games` (page/limit, search, etc.). */
export type GamesListParams = {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
};

/**
 * `GET /games` — list catalog games.
 *
 * The backend may return either a paginated envelope (`Paginated<Game>`) or a
 * bare `Game[]`; callers handle both shapes.
 */
export async function list(
  params?: GamesListParams
): Promise<Paginated<Game> | Game[]> {
  const res = await request<Paginated<Game> | Game[]>({
    method: 'GET',
    url: '/games',
    params,
  });
  return res.data;
}

/** `GET /games/featured` — featured games. */
export async function featured(): Promise<Game[]> {
  const res = await request<Game[]>({
    method: 'GET',
    url: '/games/featured',
  });
  return res.data;
}

/** `GET /games/:slugOrId` — single game by slug or id (optional auth). */
export async function getBySlugOrId(slugOrId: string): Promise<Game> {
  const res = await request<Game>({
    method: 'GET',
    url: `/games/${encodeURIComponent(slugOrId)}`,
  });
  return res.data;
}

/**
 * `POST /games/:id/view` — record a view for a game.
 *
 * NOTE: `id` MUST be a UUID. The backend route is guarded by `ParseUUIDPipe`
 * (and `OptionalJwtAuthGuard`), so passing a slug will be rejected.
 */
export async function recordView(id: string): Promise<void> {
  await request<void>({
    method: 'POST',
    url: `/games/${encodeURIComponent(id)}/view`,
  });
}

export const gamesApi = { list, featured, getBySlugOrId, recordView };

export default gamesApi;
