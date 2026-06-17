/**
 * App — the candidate starter's application entry point.
 *
 * Expo loads `node_modules/expo/AppEntry.js`, which imports the default export
 * of this module and registers it as the root component. This file is the one
 * place that wires the app together so it boots on a clean checkout (Req 1.3):
 *
 *   - It mounts the shared providers (SafeAreaProvider) the navigation tree and
 *     screens rely on.
 *   - On launch it calls the Auth_Store's `hydrate()` exactly once to restore a
 *     persisted session from secure storage (Req 4.3). While that resolves the
 *     store status stays `unknown`, so {@link RootNavigator} shows its neutral
 *     splash; once hydration finishes the navigator swaps to the auth stack or
 *     the app tabs based on the resolved status (Req 4.7).
 *
 * Hydration is intentionally fire-and-forget: `hydrate()` itself flips the
 * store from `unknown` to `authenticated`/`unauthenticated`, which re-renders
 * the navigator. We do not need to await it here.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/authStore';
import RootNavigator from '@/navigation/RootNavigator';

export default function App(): React.ReactElement {
  useEffect(() => {
    // Restore a persisted session once on launch (Req 4.3). Reading the action
    // off `getState()` keeps this effect's dependency list empty so it runs a
    // single time for the lifetime of the app.
    void useAuthStore.getState().hydrate();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
