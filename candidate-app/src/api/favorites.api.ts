/**
 * Favorites resource module.
 *
 * Typed functions for the JamJoys favorites/wishlist endpoints. Calls route
 * through the shared {@link request} helper so failures surface as a structured
 * `ApiError` (Requirement 2.3) and the 401 refresh/retry interceptor applies
 * uniformly. Each function returns the parsed `response.data`.
 *
 * Routes (targeted exactly as published — Requirement 2.6):
 * - `list`     → `GET    /favorites`
 * - `wishlist` → `GET    /favorites/wishlist`
 * - `add`      → `POST   /favorites/:gameId`
 * - `remove`   → `DELETE /favorites/:gameId`
 * - `check`    → `GET    /favorites/:gameId/check`  → `{ isFavorite }`
 *
 * Requirements: 2.5, 2.6, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { request } from './client';
import type { FavoriteCheckRes, Game } from './types';

/** `GET /favorites` — the user's favorited games. */
export async function list(): Promise<Game[]> {
  const res = await request<Game[]>({
    method: 'GET',
    url: '/favorites',
  });
  return res.data;
}

/** `GET /favorites/wishlist` — the user's wishlisted games. */
export async function wishlist(): Promise<Game[]> {
  const res = await request<Game[]>({
    method: 'GET',
    url: '/favorites/wishlist',
  });
  return res.data;
}

/** `POST /favorites/:gameId` — add a game to favorites. */
export async function add(gameId: string): Promise<void> {
  await request<void>({
    method: 'POST',
    url: `/favorites/${encodeURIComponent(gameId)}`,
  });
}

/** `DELETE /favorites/:gameId` — remove a game from favorites. */
export async function remove(gameId: string): Promise<void> {
  await request<void>({
    method: 'DELETE',
    url: `/favorites/${encodeURIComponent(gameId)}`,
  });
}

/** `GET /favorites/:gameId/check` — whether the game is favorited. */
export async function check(gameId: string): Promise<FavoriteCheckRes> {
  const res = await request<FavoriteCheckRes>({
    method: 'GET',
    url: `/favorites/${encodeURIComponent(gameId)}/check`,
  });
  return res.data;
}

export const favoritesApi = { list, wishlist, add, remove, check };

export default favoritesApi;
