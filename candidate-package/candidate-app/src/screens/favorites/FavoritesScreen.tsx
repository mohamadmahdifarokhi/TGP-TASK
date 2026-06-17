/**
 * FavoritesScreen — lists the user's favorited games.
 *
 * Fetches `GET /favorites` via {@link favoritesApi.list} on mount and renders
 * the result as a scrollable list of {@link GameCard}s. The async lifecycle is
 * funnelled through the shared {@link StateView} so loading / error+retry /
 * empty handling is consistent with the rest of the app.
 *
 * Requirements honored here:
 *  - 8.4: On open, call `GET /favorites` and display the favorited games.
 *  - 10.1: Show a loading indicator while the request is in flight.
 *  - 10.2: Show a human-readable error message (with retry) on failure.
 *  - 10.3: Show an empty-state message when zero favorites are returned.
 *
 * Implementation notes:
 *  - `loading` is always cleared in a `finally` so the spinner can never get
 *    stuck (mirrors the BUG-06 guard).
 *  - The list data is guarded against `undefined` (defaults to `[]`) so an
 *    empty/absent response renders the empty state rather than crashing.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { favoritesApi } from '@/api/favorites.api';
import type { ApiError, Game } from '@/api/types';
import { GameCard } from '@/components/GameCard';
import { StateView } from '@/components/StateView';

/**
 * Loosely typed navigation prop so this screen compiles independently of the
 * navigator (authored in task 9.6).
 */
export type FavoritesScreenProps = {
  navigation: any;
};

export function FavoritesScreen({
  navigation,
}: FavoritesScreenProps): React.ReactElement {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await favoritesApi.list();
      // Guard against an undefined/absent response body (Req 10.3 / BUG-06).
      setGames(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      // Always clear loading, whether the request succeeded or failed.
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePress = useCallback(
    (game: Game) => {
      // Navigation is wired in 9.6; guard so the screen works standalone too.
      navigation?.navigate?.('GameDetail', { slugOrId: game.slug ?? game.id });
    },
    [navigation]
  );

  return (
    <StateView
      loading={loading}
      error={error}
      isEmpty={games.length === 0}
      emptyMessage="You haven't favorited any games yet."
      onRetry={load}
    >
      <FlatList
        testID="favorites-list"
        data={games}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GameCard game={item} onPress={handlePress} />
        )}
        contentContainerStyle={styles.listContent}
      />
    </StateView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
});

export default FavoritesScreen;
