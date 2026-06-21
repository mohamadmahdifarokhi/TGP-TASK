// Feature: employment-frontend, Property 6: Pagination append preserves order and contents
/**
 * Property 6: Pagination append preserves order and contents.
 *
 * For ANY list partitioned into ordered pages, loading the pages sequentially
 * produces a combined list equal to the in-order concatenation of those pages,
 * with no dropped or duplicated items.
 *
 * Under test (pure helpers, no I/O mocking required):
 *   - `appendPage`      — appends one page onto the accumulated items.
 *   - `accumulatePages` — concatenates an ordered list of pages.
 *
 * Strategy: generate a flat array of items, split it at random ordered cut
 * points into contiguous pages (whose in-order concatenation IS the original),
 * then assert both folding `appendPage` over the pages and `accumulatePages`
 * reproduce the original array exactly, with preserved length.
 *
 * BUG-06 affects the catalog screen's pagination behavior, but this pure util
 * stays correct; the property is linked to that requirement.
 *
 
 */
import fc from 'fast-check';

import { appendPage, accumulatePages } from '../../utils/pagination';

// Speed override (user-specified): keep runs low, allow env override.
const NUM_RUNS = Number(process.env.FC_NUM_RUNS) || 30;

/**
 * Partition a flat array into contiguous, ordered pages whose in-order
 * concatenation is exactly the original array. Random cut points in
 * `[0, items.length]` form the page boundaries; this can yield empty pages,
 * a realistic edge worth exercising.
 */
function partitionIntoPages<T>(items: readonly T[], rawCuts: readonly number[]): T[][] {
  const cuts = rawCuts.map((c) => Math.min(Math.abs(c), items.length));
  const boundaries = Array.from(new Set([0, items.length, ...cuts])).sort((a, b) => a - b);

  const pages: T[][] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    pages.push(items.slice(boundaries[i], boundaries[i + 1]));
  }
  return pages;
}

describe('Property 6: pagination append preserves order and contents', () => {
  it('sequential page loading equals the in-order concatenation, with no drops or duplicates', () => {
    fc.assert(
      fc.property(
        // Tag each item with a unique sequence id so any reordering or
        // duplication would be detectable, alongside an arbitrary payload.
        fc.array(fc.anything()).map((arr) => arr.map((value, id) => ({ id, value }))),
        fc.array(fc.nat(), { maxLength: 10 }),
        (items, rawCuts) => {
          const pages = partitionIntoPages(items, rawCuts);

          // Fold appendPage over the pages starting from [].
          const folded = pages.reduce<typeof items>(
            (acc, page) => appendPage(acc, page),
            [],
          );

          // 1. Folding appendPage equals the in-order concatenation of pages.
          expect(folded).toEqual([...items]);
          // 2. accumulatePages agrees with the manual fold.
          expect(accumulatePages(pages)).toEqual([...items]);
          // 3. No item dropped or duplicated: length is preserved.
          const sumOfPageLengths = pages.reduce((n, page) => n + page.length, 0);
          expect(folded.length).toBe(sumOfPageLengths);
          expect(folded.length).toBe(items.length);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});
