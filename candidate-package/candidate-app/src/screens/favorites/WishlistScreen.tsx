/**
 * WishlistScreen — lists the user's wishlisted games.
 *
 * Fetches `GET /favorites/wishlist` via {@link favoritesApi.wishlist} on mount
 * and renders the result as a scrollable list of {@link GameCard}s. The async
 * lifecycle is funnelled through the shared {@link StateView} so loading /
 * error+retry / empty handling is consistent with the rest of the app.
 *
 *         games.
 *
 * Implementation notes:
 *  - `loading` is always cleared in a `finally` so the spinner can never get
 *    stuck if a request fails.
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
 * navigator.
 */
export type WishlistScreenProps = {
  navigation: any;
};

export function WishlistScreen({
  navigation,
}: WishlistScreenProps): React.ReactElement {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await favoritesApi.wishlist();
      // Guard against an undefined/absent response body.
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
      // Guard so the screen works standalone too.
      navigation?.navigate?.('GameDetail', { slugOrId: game.slug ?? game.id });
    },
    [navigation]
  );

  return (
    <StateView
      loading={loading}
      error={error}
      isEmpty={games.length === 0}
      emptyMessage="Your wishlist is empty."
      onRetry={load}
    >
      <FlatList
        testID="wishlist-list"
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

export default WishlistScreen;
