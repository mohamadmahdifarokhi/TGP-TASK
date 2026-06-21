// Feature: employment-frontend, Property 9: Optimistic favorite is keyed by gameId and reverts on failure
/**
 * Property-based test for Property 9.
 *
 * For ANY list of games (with unique ids and random favorite flags) and ANY
 * target gameId chosen from that list, the optimistic favorite reducer
 * (`optimisticToggle` / `revert`) must:
 *
 *  - SUCCESS PATH: after `optimisticToggle`, ONLY the target game's
 *    `isFavorite` is flipped; every other game is left unchanged.
 *  - FAILURE PATH: `revert(next, gameId, prev)` restores the target to its
 *    prior value, so the result deep-equals the original list.
 *  - KEYED BY ID, NOT INDEX: shuffling the list before toggling affects the
 *    SAME game (identified by `gameId`), regardless of its position, and
 *    changes no other game's favorite state.
 *
 * These reducer functions are pure, so no mocking/transport is involved.
 *
 * Speed: iteration count is tunable via `FC_NUM_RUNS` and defaults LOW so the
 * suite stays fast; override with `FC_NUM_RUNS=200 npm test` for deeper runs.
 *
 
 */
import fc from 'fast-check';

import {
  optimisticToggle,
  revert,
  type FavoritableGame,
} from '../../utils/favoritesReducer';

/** Tunable iteration count; defaults LOW for fast local/CI runs. */
const NUM_RUNS = Number(process.env.FC_NUM_RUNS) || 30;

/** Build a minimal valid `FavoritableGame` with the given id and flag. */
function makeGame(id: string, isFavorite: boolean): FavoritableGame {
  return {
    id,
    slug: `slug-${id}`,
    title: `title-${id}`,
    description: `desc-${id}`,
    thumbnail: null,
    isFavorite,
  };
}

/** Map of id -> normalized isFavorite, for order-independent comparison. */
function stateById(games: readonly FavoritableGame[]): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const g of games) {
    out[g.id] = g.isFavorite === true;
  }
  return out;
}

/**
 * Arbitrary: a non-empty list of games with UNIQUE ids and random favorite
 * flags, plus a target id picked from the list and a shuffled copy of the
 * SAME games (the target now sits at a potentially different index).
 */
const scenarioArb = fc
  .uniqueArray(fc.string({ minLength: 1, maxLength: 8 }), {
    minLength: 1,
    maxLength: 20,
  })
  .chain((ids) =>
    fc.record({
      games: fc.tuple(
        ...ids.map((id) =>
          fc.boolean().map((isFavorite) => makeGame(id, isFavorite))
        )
      ),
      targetIndex: fc.integer({ min: 0, max: ids.length - 1 }),
      perm: fc.shuffledSubarray(ids, { minLength: ids.length }),
    })
  )
  .map(({ games, targetIndex, perm }) => {
    const list = games as FavoritableGame[];
    const byId = new Map(list.map((g) => [g.id, g] as const));
    return {
      games: list,
      gameId: list[targetIndex].id,
      // A reordering of the SAME games (target now at a different index).
      shuffled: perm.map((id) => byId.get(id) as FavoritableGame),
    };
  });

describe('Property 9: Optimistic favorite is keyed by gameId and reverts on failure', () => {
  it('toggles exactly the target by gameId, reverts on failure, and is order-independent', () => {
    fc.assert(
      fc.property(scenarioArb, ({ games, gameId, shuffled }) => {
        const original = stateById(games);

        // --- Optimistic toggle (success path) ---
        const { next, prev } = optimisticToggle(games, gameId);

        // `prev` reflects the target's prior value.
        expect(prev).toBe(original[gameId]);

        const nextState = stateById(next);
        // Target's favorite is flipped...
        expect(nextState[gameId]).toBe(!prev);
        // ...and EVERY other game is unchanged (compared by id, not position).
        for (const id of Object.keys(original)) {
          if (id === gameId) continue;
          expect(nextState[id]).toBe(original[id]);
        }

        // --- Failure path: revert restores the original list exactly ---
        const reverted = revert(next, gameId, prev);
        expect(stateById(reverted)).toEqual(original);

        // --- Keyed by id, not index: same target affected after a shuffle ---
        const shuffledResult = optimisticToggle(shuffled, gameId);
        expect(shuffledResult.prev).toBe(prev);
        const shuffledState = stateById(shuffledResult.next);
        // Same game (by id) flipped; no other game's favorite state changed,
        // regardless of where the target sits in the reordered list.
        expect(shuffledState[gameId]).toBe(!prev);
        for (const id of Object.keys(original)) {
          if (id === gameId) continue;
          expect(shuffledState[id]).toBe(original[id]);
        }
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
