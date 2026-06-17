// Feature: employment-frontend, Property 7: Game display reads configuration fields, not legacy enums
/**
 * Property 7: Game display reads configuration fields, not legacy enums.
 *
 * For ANY game object containing `categoryConfig` / `difficultyConfig`, the
 * display mapper (`toDisplayGame` in `src/utils/gameDisplay.ts`) derives the
 * category and difficulty values from those CONFIG fields and NEVER from the
 * legacy `category` / `difficulty` enum fields.
 *
 * Strategy: generate a game whose `categoryConfig` / `difficultyConfig` carry a
 * known non-empty label under one of the recognized display keys (`name` /
 * `label` / `title`), and ALSO attach DISTINCT decoy `category` / `difficulty`
 * legacy enum values (cast through `as any`, since the `Game` type does not
 * declare legacy fields). The decoys are always constructed to differ from the
 * config labels, so a mapper that read the wrong source would produce a
 * different result and fail. We therefore assert the mapper output EQUALS the
 * config-derived label and does NOT equal the legacy decoy value.
 *
 * The mapper under test is pure, so no I/O mocking is required.
 *
 * Speed: iteration count is tunable via `FC_NUM_RUNS` and defaults LOW so the
 * suite stays fast; override with `FC_NUM_RUNS=200 npm test` for deeper runs.
 *
 * **Validates: Requirements 6.5**
 */
import fc from 'fast-check';

import { toDisplayGame } from '../../utils/gameDisplay';
import type { Game } from '../../api/types';

/** Tunable iteration count; defaults LOW for fast local/CI runs. */
const NUM_RUNS = Number(process.env.FC_NUM_RUNS) || 30;

/** A non-empty label string usable as a config display value. */
const labelArb = fc.string({ minLength: 1 }).filter((s) => s.length > 0);

/** Which recognized display key the config object carries its label under. */
const configKeyArb = fc.constantFrom('name', 'label', 'title');

describe('Property 7: Game display reads configuration fields, not legacy enums', () => {
  it('derives category/difficulty from *Config fields, never from legacy enum fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string(),
          slug: fc.string(),
          title: fc.string(),
          description: fc.string(),
          categoryLabel: labelArb,
          difficultyLabel: labelArb,
          categoryKey: configKeyArb,
          difficultyKey: configKeyArb,
        }),
        (base) => {
          // Legacy decoy values are constructed to DIFFER from the config
          // labels so that a mapper reading the wrong (legacy) source would
          // produce a different result and be detected.
          const legacyCategory = `${base.categoryLabel}__LEGACY_CATEGORY`;
          const legacyDifficulty = `${base.difficultyLabel}__LEGACY_DIFFICULTY`;

          const game = {
            id: base.id,
            slug: base.slug,
            title: base.title,
            description: base.description,
            thumbnail: null,
            categoryConfig: { [base.categoryKey]: base.categoryLabel },
            difficultyConfig: { [base.difficultyKey]: base.difficultyLabel },
            // Legacy enum fields are not part of the Game type; attach via cast.
            category: legacyCategory,
            difficulty: legacyDifficulty,
          } as any as Game;

          const display = toDisplayGame(game);

          // Must equal the CONFIG-derived value...
          expect(display.category).toBe(base.categoryLabel);
          expect(display.difficulty).toBe(base.difficultyLabel);
          // ...and must NEVER equal the legacy decoy enum value. The decoys
          // always differ from the config labels by construction.
          expect(display.category).not.toBe(legacyCategory);
          expect(display.difficulty).not.toBe(legacyDifficulty);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
