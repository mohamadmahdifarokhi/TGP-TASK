/**
 * GameCard — a reusable catalog list item.
 *
 * Renders a single game's title, thumbnail, and (optionally) category. All
 * display fields are sourced from the pure `toDisplayGame` mapper, which derives
 * category/difficulty from the backend's configuration-object fields
 * (`categoryConfig` / `difficultyConfig`) and NEVER from the legacy
 * `category` / `difficulty` enum fields (Requirement 6.5).
 *
 * The card displays at minimum the title and thumbnail (Requirement 5.2) and
 * is wrapped in a touchable that invokes `onPress` with the original `Game`.
 */

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { Game } from '../api/types';
import { toDisplayGame } from '../utils/gameDisplay';

export type GameCardProps = {
  /** The backend game to render. */
  game: Game;
  /** Invoked with the original game when the card is pressed. */
  onPress?: (game: Game) => void;
};

/**
 * A single catalog card. Pure presentational component: it derives its display
 * fields from `toDisplayGame` and reports presses back to the parent.
 */
export function GameCard({ game, onPress }: GameCardProps): React.ReactElement {
  const display = toDisplayGame(game);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress ? () => onPress(game) : undefined}
      // Disable the touch feedback entirely when there's no handler.
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={display.title}
      testID={`game-card-${display.id}`}
    >
      {display.thumbnail ? (
        <Image
          source={{ uri: display.thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
          testID={`game-card-thumbnail-${display.id}`}
        />
      ) : (
        // Guard the null thumbnail: render a placeholder rather than passing
        // `{ uri: null }` to <Image>, which would be invalid.
        <View
          style={[styles.thumbnail, styles.thumbnailPlaceholder]}
          testID={`game-card-thumbnail-placeholder-${display.id}`}
        />
      )}

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {display.title}
        </Text>

        {display.category.length > 0 ? (
          <Text style={styles.category} numberOfLines={1}>
            {display.category}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default GameCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#e1e4e8',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  category: {
    marginTop: 4,
    fontSize: 13,
    color: '#666666',
  },
});
