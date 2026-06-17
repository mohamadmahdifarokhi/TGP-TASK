/**
 * StateView — a reusable component that renders exactly one of the four
 * canonical screen states: loading, error+retry, empty, or data.
 *
 * Every content screen funnels its async lifecycle through this component so
 * loading / error / empty handling is consistent across the app
 * (Requirements 5.3, 5.4, 5.5, 10.1, 10.2, 10.3, 10.4).
 *
 * State precedence (first match wins):
 *   1. `loading`  -> spinner (Req 5.3, 10.1)
 *   2. `error`    -> human-readable message + Retry control (Req 5.4, 10.2)
 *   3. `isEmpty`  -> empty-state message (Req 5.5, 10.3)
 *   4. otherwise  -> `children` (the data state)
 *
 * The error branch is backed by {@link getErrorMessage}, which guarantees a
 * NON-EMPTY, human-readable string for any `ApiError` — even one with a blank
 * or missing `message` (Property 10).
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { ApiError } from '../api/types';

/** Default message used when an `ApiError` carries no usable text. */
export const DEFAULT_ERROR_MESSAGE = 'Something went wrong';

/** Default message used for the empty state when none is supplied. */
export const DEFAULT_EMPTY_MESSAGE = 'Nothing to show yet';

/**
 * Derive a guaranteed non-empty, human-readable message from an `ApiError`.
 *
 * This is a pure helper (no I/O, no side effects) so it can be exercised
 * directly and exhaustively by the Property 10 test. It NEVER returns an empty
 * or whitespace-only string:
 *   - When `error.message` has meaningful (non-blank) text, that text is used.
 *   - Otherwise it falls back to {@link DEFAULT_ERROR_MESSAGE}, optionally
 *     annotated with the HTTP status code when one is available, e.g.
 *     `"Something went wrong (status 500)"`.
 *
 * @param error The structured client error to describe.
 * @returns A non-empty, human-readable message string.
 */
export function getErrorMessage(error: ApiError): string {
  const trimmed = typeof error?.message === 'string' ? error.message.trim() : '';
  if (trimmed.length > 0) {
    return trimmed;
  }

  const status = typeof error?.status === 'number' ? error.status : undefined;
  // A positive status is informative; 0/undefined typically means a transport
  // failure (timeout / no network) where the bare default reads better.
  if (status !== undefined && status > 0) {
    return `${DEFAULT_ERROR_MESSAGE} (status ${status})`;
  }
  return DEFAULT_ERROR_MESSAGE;
}

export type StateViewProps = {
  /** When true, render a loading indicator (highest precedence). */
  loading?: boolean;
  /** A structured error to render with a retry control, or null/undefined for none. */
  error?: ApiError | null;
  /** When true (and not loading/error), render the empty state. */
  isEmpty?: boolean;
  /** Message shown in the empty state. Falls back to a sensible default. */
  emptyMessage?: string;
  /** Invoked when the user taps the Retry control in the error state. */
  onRetry?: () => void;
  /** The data state — rendered when not loading, errored, or empty. */
  children?: React.ReactNode;
};

/**
 * Render the appropriate state view based on the supplied flags.
 *
 * See the module docstring for the state precedence rules.
 */
export function StateView({
  loading,
  error,
  isEmpty,
  emptyMessage,
  onRetry,
  children,
}: StateViewProps): React.ReactElement {
  if (loading) {
    return (
      <View style={styles.center} testID="state-view-loading">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center} testID="state-view-error">
        <Text style={styles.errorText} testID="state-view-error-message">
          {getErrorMessage(error)}
        </Text>
        {onRetry ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Retry"
            onPress={onRetry}
            style={styles.retryButton}
            testID="state-view-retry"
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.center} testID="state-view-empty">
        <Text style={styles.emptyText} testID="state-view-empty-message">
          {emptyMessage && emptyMessage.trim().length > 0
            ? emptyMessage
            : DEFAULT_EMPTY_MESSAGE}
        </Text>
      </View>
    );
  }

  // Data state: render whatever the caller provided.
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#b00020',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#1f6feb',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
  },
});

export default StateView;
