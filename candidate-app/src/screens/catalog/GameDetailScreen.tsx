/**
 * GameDetailScreen — a single game's detail view.
 *
 * On mount it loads the game via `games.getBySlugOrId` and renders the title,
 * description, and associated videos using the `toDisplayGame` mapper for
 * display fields.
 *
 * Side effects on load:
 *   - Fires `POST /games/:id/view` using the game's UUID `id`. The view route
 *     is guarded by `ParseUUIDPipe`, so we pass `game.id` (the UUID), not the
 *     slug used to fetch it.
 *   - Calls `GET /favorites/:gameId/check` to reflect the current favorite
 *     status in the favorite control.
 *
 * Favorite toggle: uses the `optimisticToggle` reducer, applies the change
 * immediately, calls `favorites.add` / `favorites.remove`, and rolls back on
 * failure.
 *
 * Errors funnel through `StateView` with a Retry control.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as favorites from '../../api/favorites.api';
import * as games from '../../api/games.api';
import type { ApiError, Video } from '../../api/types';
import StateView from '../../components/StateView';
import { toDisplayGame } from '../../utils/gameDisplay';
import {
  optimisticToggle,
  revert,
  type FavoritableGame,
} from '../../utils/favoritesReducer';

/** Route params this screen expects. */
export type GameDetailScreenParams = { slugOrId: string };

/** Loosely-typed route/navigation so this compiles ahead of the navigator. */
type LooseRoute = { params?: { slugOrId?: string } };

export type GameDetailScreenProps = {
  route?: LooseRoute;
  navigation?: { goBack?: () => void };
};

export function GameDetailScreen({ route }: GameDetailScreenProps): React.ReactElement {
  const slugOrId = route?.params?.slugOrId ?? '';

  // We keep the loaded game in a single-element favoritable list so the pure
  // `optimisticToggle` / `revert` reducer (keyed by gameId) drives the
  // favorite control directly.
  const [gameList, setGameList] = useState<FavoritableGame[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [favBusy, setFavBusy] = useState<boolean>(false);
  const [favError, setFavError] = useState<ApiError | null>(null);

  const game = gameList[0];

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await games.getBySlugOrId(slugOrId);
      setGameList([{ ...loaded, isFavorite: false }]);

      // Record the view using the game's UUID id (NOT the slug).
      // Fire-and-forget: a failed view-record must not block the detail UI.
      void games.recordView(loaded.id).catch(() => {
        /* view tracking is best-effort */
      });

      // Reflect current favorite status on open.
      void favorites
        .check(loaded.id)
        .then((res) => {
          setGameList((prev) =>
            prev.map((g) =>
              g.id === loaded.id ? { ...g, isFavorite: res.isFavorite } : g
            )
          );
        })
        .catch(() => {
          /* leave default (not favorited) if the check fails */
        });
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, [slugOrId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  /** Optimistically toggle favorite, calling add/remove and reverting on fail. */
  const onToggleFavorite = useCallback(async () => {
    if (!game || favBusy) {
      return;
    }
    setFavError(null);

    const gameId = game.id;
    const wasFavorite = game.isFavorite === true;

    // Optimistic update keyed by gameId (never index).
    const { next, prev } = optimisticToggle(gameList, gameId);
    setGameList(next);
    setFavBusy(true);

    try {
      if (wasFavorite) {
        await favorites.remove(gameId);
      } else {
        await favorites.add(gameId);
      }
    } catch (err) {
      // Roll back the optimistic change on failure.
      setGameList((current) => revert(current, gameId, prev));
      setFavError(err as ApiError);
    } finally {
      setFavBusy(false);
    }
  }, [game, favBusy, gameList]);

  const display = game ? toDisplayGame(game) : null;
  const videos: Video[] = game?.videos ?? [];

  return (
    <View style={styles.container} testID="game-detail-screen">
      <StateView
        loading={loading}
        error={error}
        onRetry={loadDetail}
      >
        {display ? (
          <ScrollView contentContainerStyle={styles.content} testID="game-detail-content">
            <Text style={styles.title} testID="game-detail-title">
              {display.title}
            </Text>

            {display.category.length > 0 ? (
              <Text style={styles.meta} testID="game-detail-category">
                {display.category}
                {display.difficulty.length > 0 ? ` · ${display.difficulty}` : ''}
              </Text>
            ) : null}

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={game?.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              onPress={onToggleFavorite}
              disabled={favBusy}
              style={[styles.favButton, game?.isFavorite ? styles.favButtonActive : null]}
              testID="game-detail-favorite"
            >
              <Text style={styles.favButtonLabel}>
                {game?.isFavorite ? '★ Favorited' : '☆ Favorite'}
              </Text>
            </TouchableOpacity>

            {favError ? (
              <Text style={styles.favError} testID="game-detail-favorite-error">
                Couldn&apos;t update favorite. Please try again.
              </Text>
            ) : null}

            <Text style={styles.description} testID="game-detail-description">
              {game?.description ?? ''}
            </Text>

            <Text style={styles.sectionHeading}>Videos</Text>
            {videos.length > 0 ? (
              videos.map((video) => (
                <View key={video.id} style={styles.videoRow} testID={`game-detail-video-${video.id}`}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {video.title}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyVideos} testID="game-detail-no-videos">
                No videos available for this game.
              </Text>
            )}
          </ScrollView>
        ) : null}
      </StateView>
    </View>
  );
}

export default GameDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
    color: '#666666',
  },
  favButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#eef2f7',
  },
  favButtonActive: {
    backgroundColor: '#ffe9a8',
  },
  favButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  favError: {
    marginTop: 8,
    fontSize: 13,
    color: '#b00020',
  },
  description: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
  },
  sectionHeading: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  videoRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e4e8',
  },
  videoTitle: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  emptyVideos: {
    fontSize: 14,
    color: '#6b7280',
  },
});
