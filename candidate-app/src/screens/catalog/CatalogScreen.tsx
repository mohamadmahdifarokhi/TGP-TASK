/**
 * CatalogScreen — the game catalog browser.
 *
 * On mount it calls `GET /games` (via `games.list`) and renders the returned
 * games as a scrollable `FlatList` of `GameCard`s. The canonical async states
 * (loading / error+retry / empty / data) are funneled through `StateView`.
 *
 * Pagination: when the list reaches its end, the next page is requested and
 * appended via the pure `appendPage` pagination util. The backend may return
 * either a `Paginated<Game>` envelope or a bare `Game[]`.
 *
 * Tapping a card navigates to `GameDetail`.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import * as games from '../../api/games.api';
import type { ApiError, Game, Paginated } from '../../api/types';
import GameCard from '../../components/GameCard';
import StateView from '../../components/StateView';
import { DEFAULT_INITIAL_PAGE, DEFAULT_PAGE_SIZE } from '../../config';
import { appendPage } from '../../utils/pagination';

/** Param list fragment this screen contributes. */
export type CatalogScreenParams = undefined;

/** Loosely-typed navigation for the catalog screen. */
type LooseNavigation = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

export type CatalogScreenProps = {
  navigation?: LooseNavigation;
};

/**
 * Normalize a `games.list` result (which may be `Paginated<Game>` or `Game[]`)
 * into a concrete `{ items, total }` pair.
 */
function normalizeListResult(result: Paginated<Game> | Game[]): {
  items: Game[];
  total: number | null;
} {
  if (Array.isArray(result)) {
    return { items: result, total: null };
  }
  const items = result.data;
  const total = typeof result?.total === 'number' ? result.total : null;
  return { items, total };
}

export function CatalogScreen({ navigation }: CatalogScreenProps): React.ReactElement {
  const [items, setItems] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [page, setPage] = useState<number>(DEFAULT_INITIAL_PAGE);
  const [total, setTotal] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  /** Load the first page (also used by the Retry control). */
  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await games.list({
        page: DEFAULT_INITIAL_PAGE,
        limit: DEFAULT_PAGE_SIZE,
      });
      const { items: firstItems, total: firstTotal } = normalizeListResult(result);
      setItems(firstItems);
      setTotal(firstTotal);
      setPage(DEFAULT_INITIAL_PAGE);
      setLoading(false);
    } catch (err) {
      setError(err as ApiError);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  /** Load and append the next page when the user scrolls to the end. */
  const loadNextPage = useCallback(async () => {
    // Skip while a load is already in flight, or there's an error to clear.
    if (loading || loadingMore || error) {
      return;
    }
    // If we know the total and have it all, there's nothing more to fetch.
    if (total !== null && items.length >= total) {
      return;
    }

    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const result = await games.list({ page: nextPage, limit: DEFAULT_PAGE_SIZE });
      const { items: pageItems, total: pageTotal } = normalizeListResult(result);

      // A bare empty page means we've reached the end — stop paginating.
      if (pageItems.length === 0) {
        if (pageTotal !== null) {
          setTotal(pageTotal);
        }
        return;
      }

      // Append in order with the pure pagination util (no drops/dupes).
      setItems((prev) => appendPage(prev, pageItems));
      setPage(nextPage);
      if (pageTotal !== null) {
        setTotal(pageTotal);
      }
    } catch {
      // A failed "load more" must not blow away the already-rendered list or
      // surface the full-screen error state; the user can scroll to retry.
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, error, total, items.length, page]);

  const renderItem = useCallback(
    ({ item }: { item: Game }) => (
      <GameCard
        game={item}
        onPress={(game) => navigation?.navigate('GameDetail', { slugOrId: game.id })}
      />
    ),
    [navigation]
  );

  // Map over the response data directly.
  const data = items;

  return (
    <View style={styles.container} testID="catalog-screen">
      <StateView
        loading={loading}
        error={error}
        isEmpty={!loading && !error && data.length === 0}
        emptyMessage="No games available yet"
        onRetry={loadFirstPage}
      >
        <FlatList
          data={data}
          keyExtractor={(game) => game.id}
          renderItem={renderItem}
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          testID="catalog-list"
        />
      </StateView>
    </View>
  );
}

export default CatalogScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
});
