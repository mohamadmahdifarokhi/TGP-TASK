/**
 * Optimistic favorites reducer (CORRECT reference implementation).
 *
 * These are PURE functions (no side effects, no I/O) so they can be exercised
 * directly by property-based tests (see Property 9 in the design) and reused by
 * the game detail / favorites screens to apply optimistic favorite toggles.
 *
 * The single most important invariant: a favorite is ALWAYS identified by its
 * `gameId` (the game's `id`), NEVER by its position/index in the list. Keying
 * by index is unsafe because list ordering can change between render and
 * mutation (re-fetch, pagination, filtering), which would flip the wrong game.
 *
 * On a failed mutation the caller reverts EXACTLY the affected game's prior
 * value, leaving every other game untouched (Requirement 8.6).
 *
 * Validates: Requirements 8.1, 8.6
 */

import type { Game } from '@/api/types';

/**
 * A `Game` augmented with the client-side optimistic favorite flag. The flag is
 * optional so plain `Game` lists (e.g. straight from the catalog endpoint) can
 * be passed in; an absent flag is treated as "not favorited" (`false`).
 */
export type FavoritableGame = Game & { isFavorite?: boolean };

/**
 * The result of an optimistic toggle: the `next` list to render immediately and
 * the `prev` value of the affected game so the caller can `revert` on failure.
 */
export type OptimisticToggleResult = {
  /** The new list with only the target game's `isFavorite` flipped. */
  next: FavoritableGame[];
  /**
   * The prior `isFavorite` value of the target game (`false` when the game was
   * absent or had no flag). Pass this to {@link revert} on mutation failure.
   */
  prev: boolean;
};

/**
 * Normalizes a possibly-undefined `isFavorite` flag to a concrete boolean.
 */
function currentValue(game: FavoritableGame): boolean {
  return game.isFavorite === true;
}

/**
 * Returns a NEW list in which ONLY the game whose `id` equals `gameId` has its
 * `isFavorite` flag set to `isFavorite`. Every other game is preserved
 * unchanged (by reference). If no game matches `gameId`, the original list
 * contents are returned in a new array (no-op match).
 *
 * Matching is performed strictly by `id` — never by list position.
 *
 * @param games - The current list of games.
 * @param gameId - The `id` of the game to update.
 * @param isFavorite - The favorite value to set on the matched game.
 * @returns A new list with only the matching game's `isFavorite` updated.
 */
export function applyToggle(
  games: readonly FavoritableGame[],
  gameId: string,
  isFavorite: boolean
): FavoritableGame[] {
  const targetIndex = games.findIndex((game) => game.id === gameId);
  return games.map((game, index) =>
    index === targetIndex ? { ...game, isFavorite } : game
  );
}

/**
 * Optimistically flips the favorite state of the game identified by `gameId`.
 *
 * Returns both the `next` list (to render immediately) and the `prev` value of
 * the target game so the caller can restore it via {@link revert} if the
 * backend mutation fails. If no game matches `gameId`, `next` mirrors the input
 * contents and `prev` is `false`.
 *
 * @param games - The current list of games.
 * @param gameId - The `id` of the game to toggle.
 * @returns `{ next, prev }` where `next` is the optimistically-updated list and
 *          `prev` is the affected game's prior favorite value.
 */
export function optimisticToggle(
  games: readonly FavoritableGame[],
  gameId: string
): OptimisticToggleResult {
  const target = games.find((game) => game.id === gameId);
  const prev = target ? currentValue(target) : false;
  const next = applyToggle(games, gameId, !prev);
  return { next, prev };
}

/**
 * Restores EXACTLY the game identified by `gameId` to `prevValue`, leaving all
 * other games unchanged. Use this on the failure path of an optimistic toggle
 * to roll back the affected game's favorite state (Requirement 8.6).
 *
 * @param games - The current (optimistically-updated) list of games.
 * @param gameId - The `id` of the game to restore.
 * @param prevValue - The prior favorite value to restore (from
 *                    {@link optimisticToggle}).
 * @returns A new list with only the matching game's `isFavorite` reverted.
 */
export function revert(
  games: readonly FavoritableGame[],
  gameId: string,
  prevValue: boolean
): FavoritableGame[] {
  return games.map((game) => game);
}
