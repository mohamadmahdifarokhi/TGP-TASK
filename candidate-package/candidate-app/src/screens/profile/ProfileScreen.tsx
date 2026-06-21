/**
 * ProfileScreen — view, edit, and manage the current user's account.
 *
 * Wiring (per the screen-to-endpoint map):
 *  - On open, loads the current user via `auth.me()` (`GET /auth/me`) — the
 *    canonical "current user" source — and shows the profile.
 *  - On open, loads the token balance via `users.tokenBalance()`
 *    (`GET /users/me/token-balance`) and displays it.
 *  - Profile edits are saved via `users.updateMe(patch)` (`PATCH /users/me`)
 *    and the screen reflects the updated values returned on success
 *.
 *  - On a read or update failure the screen surfaces a human-readable error and
 *    retains the last-known values rather than blanking them.
 *  - A Logout control calls `auth.logout()` (`POST /auth/logout`) and then
 *    `useAuthStore.getState().clearSession()` to drop every persisted credential
 *    and return the session to `unauthenticated`.
 *
 * Loading / error states are funneled through the shared {@link StateView} so
 * the screen renders consistently with the rest of the app.
 *
 * Navigation is typed loosely on purpose — the navigator owns the concrete
 * param/route types.
 *
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as authApi from '../../api/auth.api';
import * as usersApi from '../../api/users.api';
import { useAuthStore } from '../../store/authStore';
import { StateView, getErrorMessage } from '../../components/StateView';
import type { ApiError, AuthUser } from '../../api/types';

/** A structured error if a value looks like an `ApiError`, else a generic one. */
function toApiError(err: unknown): ApiError {
  if (
    err &&
    typeof err === 'object' &&
    'status' in err &&
    'message' in err &&
    typeof (err as ApiError).status === 'number'
  ) {
    return err as ApiError;
  }
  const message =
    err instanceof Error && err.message ? err.message : 'Something went wrong';
  return { status: 0, message };
}

export type ProfileScreenProps = {
  /** Loosely typed navigation prop; the concrete type lives with the navigator. */
  navigation?: unknown;
};

export function ProfileScreen(_props: ProfileScreenProps): React.ReactElement {
  // Last-known good values. These are retained on failure.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  // Initial-load lifecycle (gates the whole screen via StateView).
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<ApiError | null>(null);

  // Edit form state.
  const [avatarDraft, setAvatarDraft] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Logout lifecycle.
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  /**
   * Load the current user and token balance. The two reads are independent —
   * a balance failure must not hide an otherwise-loaded profile, so they are
   * tracked separately and the screen-level error only reflects the `me()` read
   * which gates the primary content.
   */
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const me = await authApi.me();
      setUser(me);
      setAvatarDraft(me.avatar ?? '');
    } catch (err) {
      // Retain last-known user; surface the error.
      setLoadError(toApiError(err));
      setLoading(false);
      return;
    }

    try {
      const tb = await usersApi.tokenBalance();
      setBalance(tb.balance);
    } catch {
      // Balance is secondary content: keep the last-known balance (or null) and
      // let the profile render. The primary read succeeded.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Save profile edits via `PATCH /users/me`, reflecting the returned values on
   * success. On failure, retain the last-known values and show an
   * error.
   */
  const handleSave = useCallback(async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    const nextAvatar = avatarDraft.trim();
    const patch = { avatar: nextAvatar.length > 0 ? nextAvatar : null };

    try {
      const updated = await usersApi.updateMe(patch);
      setUser(updated);
      setAvatarDraft(updated.avatar ?? '');
      setSaveMessage('Profile updated');
    } catch (err) {
      // Retain last-known values; only report the error.
      setSaveError(toApiError(err));
    } finally {
      setSaving(false);
    }
  }, [avatarDraft, saving]);

  /**
   * Logout: invalidate server-side, then clear the local session. Even if the
   * server call fails we still clear local credentials so the user is not stuck
   * in a half-authenticated state.
   */
  const handleLogout = useCallback(async () => {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore server-side logout errors — local clearing is what unauths us.
    } finally {
      await useAuthStore.getState().clearSession();
      setLoggingOut(false);
    }
  }, [loggingOut]);

  return (
    <StateView loading={loading} error={loadError} onRetry={load}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        testID="profile-screen"
      >
        <Text style={styles.heading}>Profile</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Phone number</Text>
          <Text style={styles.value} testID="profile-phone">
            {user?.phoneNumber ?? '—'}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value} testID="profile-role">
            {user?.role ?? '—'}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Subscription</Text>
          <Text style={styles.value} testID="profile-subscription">
            {user?.isSubscribed ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Token balance</Text>
          <Text style={styles.value} testID="profile-token-balance">
            {balance != null ? String(balance) : '—'}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Avatar URL</Text>
          <TextInput
            style={styles.input}
            value={avatarDraft}
            onChangeText={setAvatarDraft}
            placeholder="https://…"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
            testID="profile-avatar-input"
          />
        </View>

        {saveError ? (
          <Text style={styles.errorText} testID="profile-save-error">
            {getErrorMessage(saveError)}
          </Text>
        ) : null}

        {saveMessage ? (
          <Text style={styles.successText} testID="profile-save-success">
            {saveMessage}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
          testID="profile-save"
        >
          <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton, loggingOut && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          testID="profile-logout"
        >
          <Text style={styles.buttonText}>
            {loggingOut ? 'Logging out…' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </StateView>
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1a1a1a',
  },
  errorText: {
    fontSize: 14,
    color: '#b00020',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: '#1a7f37',
    marginBottom: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButton: {
    backgroundColor: '#1f6feb',
  },
  logoutButton: {
    backgroundColor: '#b00020',
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
