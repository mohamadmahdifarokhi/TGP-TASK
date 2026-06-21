/**
 * Auth_Store — shared authentication state for the candidate app.
 *
 * A small Zustand store that is the single source of truth for the session:
 * the access token, the refresh token, the current user, and a coarse `status`
 * the navigator switches on (`unknown` while we have not yet hydrated,
 * `authenticated` once a valid session exists, `unauthenticated` otherwise).
 *
 * The session is intended to survive an application restart: tokens are written
 * to `expo-secure-store` and read back on launch via {@link hydrate}.
 *
 * IMPORTANT (architecture): this module must NOT import the API client. The
 * dependency direction is one-directional — the API client reads from and
 * writes to this store (attach Bearer token, apply refreshed token, clear on
 * refresh failure). Importing the client here would create a circular import.
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import type { AuthState, AuthUser } from '../api/types';

// ---------------------------------------------------------------------------
// Secure storage keys
// ---------------------------------------------------------------------------

/** Secure-store key for the persisted access token. */
export const ACCESS_TOKEN_KEY = 'accessToken';
/** Secure-store key for the persisted refresh token. */
export const REFRESH_TOKEN_KEY = 'refreshToken';
/** Secure-store key for the persisted (JSON-serialized) user. */
export const USER_KEY = 'user';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

/** Arguments for {@link AuthActions.setSession}. */
export type SetSessionArgs = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

/** Imperative actions exposed by the Auth_Store. */
export type AuthActions = {
  /**
   * Establish a freshly issued session (access token, refresh token, user) and
   * mark the store `authenticated`. Used after verify-otp.
   */
  setSession: (args: SetSessionArgs) => Promise<void>;
  /**
   * Update ONLY the access token (the refresh token is reused, not replaced)
   * and persist it. Used by the API client's 401 refresh flow.
   */
  setAccessToken: (accessToken: string) => Promise<void>;
  /**
   * Delete all persisted tokens/user from secure storage and mark the store
   * `unauthenticated`. Used on logout and on refresh failure.
   */
  clearSession: () => Promise<void>;
  /**
   * Restore a session from secure storage on launch. Sets status to
   * `authenticated` when valid tokens are present, otherwise `unauthenticated`.
   */
  hydrate: () => Promise<void>;
};

/** The full Auth_Store value: persisted state plus imperative actions. */
export type AuthStore = AuthState & AuthActions;

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

/**
 * Write a single credential to secure storage, or delete the key when the value
 * is null/undefined. Keeps storage in sync with the in-memory state.
 */
async function persistItem(key: string, value: string | null | undefined): Promise<void> {
  if (value == null) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

/** Safely parse a persisted user JSON string back into an {@link AuthUser}. */
function parseUser(raw: string | null): AuthUser | null {
  if (raw == null) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * The shared Auth_Store hook.
 *
 * Initial `status` is `unknown`: the navigator should show a neutral splash
 * until {@link hydrate} resolves and resolves the status to `authenticated`
 * or `unauthenticated`.
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // --- persisted state ---
  accessToken: null,
  refreshToken: null,
  user: null,
  status: 'unknown',

  // --- actions ---
  setSession: async ({ accessToken, refreshToken, user }) => {
    // Flip the in-memory session state so the navigator switches to the
    // authenticated stack immediately after verify-otp succeeds.
    set({
      accessToken,
      refreshToken,
      user,
      status: 'authenticated',
    });
  },

  setAccessToken: async (accessToken) => {
    // Refresh returns ONLY a new access token; the stored refresh token and
    // user are intentionally left untouched.
    await persistItem(ACCESS_TOKEN_KEY, accessToken);
    set({ accessToken });
  },

  clearSession: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      status: 'unauthenticated',
    });
  },

  hydrate: async () => {
    const [accessToken, refreshToken, userRaw] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);

    // A session is restorable only when both tokens are present. The access
    // token may already be expired — that's fine; the API client's refresh flow
    // will mint a new one on the first protected request.
    if (accessToken && refreshToken) {
      set({
        accessToken,
        refreshToken,
        user: parseUser(userRaw),
        status: 'authenticated',
      });
      return;
    }

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      status: 'unauthenticated',
    });
  },
}));

export default useAuthStore;
