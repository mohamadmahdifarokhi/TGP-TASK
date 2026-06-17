/**
 * WatchHistoryScreen — lists the videos the user has previously watched.
 *
 * Fetches `GET /watch-history` via {@link watchHistoryApi.list} on mount and
 * renders the returned {@link WatchHistoryItem}s as a scrollable list. The async
 * lifecycle is funnelled through the shared {@link StateView} so loading /
 * error+retry / empty handling is consistent with the rest of the app.
 *
 * Requirements honored here:
 *  - 7.5: On open, call `GET /watch-history` and display the previously watched
 *         videos.
 *  - 10.1: Show a loading indicator while the request is in flight.
 *  - 10.2: Show a human-readable error message (with retry) on failure.
 *  - 10.3: Show an empty-state message when zero items are returned.
 *
 * Implementation notes:
 *  - Watch-history items are NOT games, so they render as a lightweight row
 *    (title + progress) rather than via `GameCard`.
 *  - `loading` is always cleared in a `finally` so the spinner can never get
 *    stuck (mirrors the BUG-06 guard).
 *  - The list data is guarded against `undefined` (defaults to `[]`) so an
 *    empty/absent response renders the empty state rather than crashing.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { ApiError, WatchHistoryItem } from '@/api/types';
import { StateView } from '@/components/StateView';
import { watchHistoryApi } from '@/api/watchHistory.api';

/**
 * Loosely typed navigation prop so this screen compiles independently of the
 * navigator (authored in task 9.6).
 */
export type WatchHistoryScreenProps = {
  navigation: any;
};

/** Derive a non-empty, human-readable label for a watch-history row. */
function itemTitle(item: WatchHistoryItem): string {
  const title = item.video?.title;
  if (typeof title === 'string' && title.trim().length > 0) {
    return title;
  }
  return 'Untitled video';
}

/** Format the stored progress (assumed 0–1 fraction) as a percentage label. */
function progressLabel(progress: number): string {
  if (typeof progress !== 'number' || Number.isNaN(progress)) {
    return '';
  }
  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
  return `${pct}% watched`;
}

export function WatchHistoryScreen({
  navigation,
}: WatchHistoryScreenProps): React.ReactElement {
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await watchHistoryApi.list();
      // Guard against an undefined/absent response body (Req 10.3 / BUG-06).
      setItems(Array.isArray(result) ? result : []);
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
    (item: WatchHistoryItem) => {
      // Navigation is wired in 9.6; guard so the screen works standalone too.
      navigation?.navigate?.('VideoPlayer', { id: item.videoId });
    },
    [navigation]
  );

  return (
    <StateView
      loading={loading}
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="You haven't watched anything yet."
      onRetry={load}
    >
      <FlatList
        testID="watch-history-list"
        data={items}
        keyExtractor={(item) => item.videoId}
        renderItem={({ item }) => {
          const label = progressLabel(item.progress);
          return (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => handlePress(item)}
              accessibilityRole="button"
              accessibilityLabel={itemTitle(item)}
              testID={`watch-history-item-${item.videoId}`}
            >
              <View style={styles.rowBody}>
                <Text style={styles.title} numberOfLines={2}>
                  {itemTitle(item)}
                </Text>
                {label.length > 0 ? (
                  <Text style={styles.progress}>{label}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </StateView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  row: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  rowBody: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progress: {
    marginTop: 4,
    fontSize: 13,
    color: '#666666',
  },
});

export default WatchHistoryScreen;
