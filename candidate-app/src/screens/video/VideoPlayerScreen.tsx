/**
 * VideoPlayerScreen.
 *
 * Loads a video and gates playback on backend access validation, then records
 * watch progress periodically while the video plays.
 *
 * On mount it issues two requests in parallel:
 *   - `GET /videos/:id`                  → video metadata
 *   - `GET /videos/:id/validate-access`  → `{ hasAccess, message }`
 *
 * Playback is gated by the pure access-gate logic (`accessGate`) wired through
 * the {@link VideoPlayer} component: when `hasAccess` is false the player shows
 * the backend-provided explanatory message and never starts.
 *
 * While the video is playing, the screen posts playback progress to
 * `POST /watch-history/:videoId` on a fixed interval
 * ({@link WATCH_PROGRESS_INTERVAL_MS}) and clears that interval on unmount so no
 * timer leaks past the screen's lifetime.
 *
 * Loading and error states funnel through the shared {@link StateView}.
 *
 * Navigation props are typed loosely here; the screen only reads the `videoId`
 * from route params.
 *
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ApiError, ValidateAccessRes, Video } from '../../api/types';
import videosApi from '../../api/videos.api';
import watchHistoryApi from '../../api/watchHistory.api';
import StateView from '../../components/StateView';
import VideoPlayer from '../../components/VideoPlayer';
import { WATCH_PROGRESS_INTERVAL_MS } from '../../config';
import { accessGate } from '../../utils/videoAccess';

/**
 * Loosely-typed navigation props. The screen only depends on
 * `route.params.videoId`.
 */
export type VideoPlayerScreenProps = {
  route?: { params?: { videoId?: string; id?: string } };
  navigation?: unknown;
};

/** Read the target video id from loosely-typed route params. */
function readVideoId(props: VideoPlayerScreenProps): string | undefined {
  const params = props?.route?.params;
  return params?.videoId ?? params?.id;
}

export function VideoPlayerScreen(props: VideoPlayerScreenProps): React.ReactElement {
  const videoId = readVideoId(props);

  const [video, setVideo] = useState<Video | null>(null);
  const [access, setAccess] = useState<ValidateAccessRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Latest known playback position (seconds). Held in a ref so the recording
  // interval always reads the current value without re-subscribing.
  const progressRef = useRef(0);
  // Active progress-recording interval handle (null when not recording).
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!videoId) {
      setLoading(false);
      setError({ status: 0, message: 'No video was specified.' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Load metadata (public) and access validation (auth) together.
      const [meta, accessRes] = await Promise.all([
        videosApi.get(videoId),
        videosApi.validateAccess(videoId),
      ]);
      setVideo(meta);
      setAccess(accessRes);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Stop and clear the progress-recording interval, if running. */
  const stopRecording = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Begin periodic progress recording once playback starts. Guards against
   * starting more than one interval. The progress posts are fire-and-forget;
   * a failed post must not crash the screen.
   */
  const startRecording = useCallback(() => {
    if (!videoId || intervalRef.current !== null) {
      return;
    }
    intervalRef.current = setInterval(() => {
      watchHistoryApi.record(videoId, progressRef.current).catch(() => {
        // Swallow transient recording failures; playback continues.
      });
    }, WATCH_PROGRESS_INTERVAL_MS);
  }, [videoId]);

  /**
   * Receive progress ticks from the player. The first tick (emitted when the
   * user starts playback) kicks off periodic recording.
   */
  const handleProgress = useCallback(
    (seconds: number) => {
      progressRef.current = seconds;
      startRecording();
    },
    [startRecording]
  );

  // Clear the interval on unmount so no timer outlives the screen.
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  // If access is denied (or the video changes), make sure recording is stopped.
  const gate = access ? accessGate(access) : { canPlay: true, message: null };
  useEffect(() => {
    if (!gate.canPlay) {
      stopRecording();
    }
  }, [gate.canPlay, stopRecording]);

  return (
    <StateView loading={loading} error={error} onRetry={load}>
      {video ? (
        <ScrollView contentContainerStyle={styles.content} testID="video-player-screen">
          <VideoPlayer video={video} access={access} onProgress={handleProgress} />

          <View style={styles.meta}>
            <Text style={styles.title} testID="video-player-screen-title">
              {video.title}
            </Text>
            {video.description ? (
              <Text style={styles.description}>{video.description}</Text>
            ) : null}
          </View>
        </ScrollView>
      ) : null}
    </StateView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  meta: {
    marginTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
});

export default VideoPlayerScreen;
