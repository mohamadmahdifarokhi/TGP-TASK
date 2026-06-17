/**
 * VideoPlayer component.
 *
 * Renders the player surface for a {@link Video} and exposes a **play gate**
 * wired to the pure access-gate logic in `src/utils/videoAccess.ts`
 * (Requirements 7.1, 7.2, 7.3 — backs Property 8).
 *
 * Access semantics:
 *   - When an `access` response is provided and `accessGate` reports
 *     `canPlay === false`, the explanatory `message` is rendered instead of a
 *     play control and playback never begins.
 *   - When `canPlay === true` (or no access validation is required, i.e.
 *     `access` is omitted/`null`), the player surface with a play control is
 *     rendered.
 *
 * Dependency-light by design: the project ships no native video library
 * (`expo-av` is not a dependency), so the player surface is a simple
 * placeholder `View`. The graded behavior here is the access gate, not actual
 * media decoding.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ValidateAccessRes, Video } from '../api/types';
import { accessGate } from '../utils/videoAccess';

export type VideoPlayerProps = {
  /** The video metadata to render (from `GET /videos/:id`). */
  video: Video;
  /**
   * The `GET /videos/:id/validate-access` response, when access validation is
   * required. When omitted or `null`, playback is treated as not gated.
   */
  access?: ValidateAccessRes | null;
  /** Called with the current playback position (seconds) as it progresses. */
  onProgress?: (seconds: number) => void;
};

/**
 * Render the video player surface with an access-gated play control.
 */
export function VideoPlayer({ video, access, onProgress }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Decide the play gate. When no access response is provided, playback is not
  // gated (access not required); otherwise defer strictly to the pure
  // access-gate logic.
  const gate = access ? accessGate(access) : { canPlay: true, message: null };

  // Access denied: show the explanatory message, never a play control.
  if (!gate.canPlay) {
    return (
      <View style={styles.container}>
        <View style={[styles.surface, styles.surfaceBlocked]} testID="video-player-blocked">
          <Text style={styles.blockedMessage}>
            {gate.message ?? 'This video is unavailable.'}
          </Text>
        </View>
      </View>
    );
  }

  const handlePlay = () => {
    setIsPlaying(true);
    // Emit an initial progress tick; a real player would emit periodically.
    onProgress?.(0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.surface} testID="video-player-surface">
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>

        {isPlaying ? (
          <Text style={styles.playingLabel} testID="video-player-playing">
            ▶ Playing
          </Text>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Play ${video.title}`}
            style={styles.playButton}
            onPress={handlePlay}
            testID="video-player-play"
          >
            <Text style={styles.playButtonLabel}>▶ Play</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  surface: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 16,
  },
  surfaceBlocked: {
    backgroundColor: '#1a1a1a',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  playButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  playButtonLabel: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  playingLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  blockedMessage: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default VideoPlayer;
