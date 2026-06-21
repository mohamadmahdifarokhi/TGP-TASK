/**
 * Pure, generic helpers for accumulating paginated list responses.
 *
 * As the user scrolls a list (e.g. the game catalog), the app fetches
 * additional pages and appends them to what it has already loaded. These
 * helpers keep that accumulation logic pure and side-effect free: loading pages
 * sequentially yields a combined list equal to the in-order concatenation of
 * those pages, with no dropped or duplicated items.
 */

import type { Paginated } from '../api/types';

/**
 * Append a freshly fetched page onto the already-accumulated items.
 *
 * Pure: returns a new array and never mutates its inputs. The result is the
 * in-order concatenation `[...accumulated, ...page]`, so order is preserved
 * and nothing is dropped or duplicated by the operation itself.
 *
 * @param accumulated Items loaded so far (earlier pages, in order).
 * @param page The newly fetched page of items to append.
 * @returns A new array containing `accumulated` followed by `page`.
 */
export function appendPage<T>(accumulated: readonly T[], page: readonly T[]): T[] {
  return [...accumulated, ...page];
}

/**
 * Concatenate an ordered list of pages into a single combined list.
 *
 * Pure: returns a new array and never mutates its inputs. Equivalent to
 * folding {@link appendPage} over `pages` starting from an empty list, i.e.
 * the in-order concatenation of every page.
 *
 * @param pages Pages in the order they were (or would be) loaded.
 * @returns A new array equal to the in-order concatenation of all pages.
 */
export function accumulatePages<T>(pages: readonly (readonly T[])[]): T[] {
  return pages.reduce<T[]>((acc, page) => appendPage(acc, page), []);
}

/**
 * Convenience helper that appends the `data` of a {@link Paginated} response
 * onto the already-accumulated items.
 *
 * Pure: delegates to {@link appendPage} and never mutates its inputs.
 *
 * @param accumulated Items loaded so far (earlier pages, in order).
 * @param response A paginated backend response whose `data` should be appended.
 * @returns A new array containing `accumulated` followed by `response.data`.
 */
export function appendPaginated<T>(
  accumulated: readonly T[],
  response: Paginated<T>,
): T[] {
  return appendPage(accumulated, response.data);
}

/**
 * Determine whether more pages remain to be loaded for a paginated response.
 *
 * Pure helper used by infinite-scroll logic to decide whether to request the
 * next page. Returns `true` while the number of items loaded so far is less
 * than the reported `total`.
 *
 * @param response The most recent paginated response.
 * @param loadedCount Total number of items accumulated so far.
 * @returns `true` if more items remain on the server, otherwise `false`.
 */
export function hasMorePages<T>(response: Paginated<T>, loadedCount: number): boolean {
  return loadedCount < response.total;
}
