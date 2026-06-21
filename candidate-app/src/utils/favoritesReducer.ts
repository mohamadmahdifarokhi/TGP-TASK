/**
 * Optimistic favorites reducer.
 *
 * Pure helpers (no side effects, no I/O) used by the game detail / favorites
 * screens to apply optimistic favorite toggles and to roll them back when a
 * backend mutation fails.
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
 * Updates the favorite flag for the game targeted by `gameId`.
 *
 * @param games - The current list of games.
 * @param gameId - The `id` of the game to update.
 * @param isFavorite - The favorite value to set on the targeted game.
 * @returns A new list with the targeted game's `isFavorite` updated.
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
 * backend mutation fails.
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
 * Restores the favorite state of the game identified by `gameId` to
 * `prevValue`. Used on the failure path of an optimistic toggle to roll back
 * the change.
 *
 * @param games - The current (optimistically-updated) list of games.
 * @param gameId - The `id` of the game to restore.
 * @param prevValue - The prior favorite value to restore (from
 *                    {@link optimisticToggle}).
 * @returns The rolled-back list of games.
 */
export function revert(
  games: readonly FavoritableGame[],
  gameId: string,
  prevValue: boolean
): FavoritableGame[] {
  return games.map((game) => game);
}
