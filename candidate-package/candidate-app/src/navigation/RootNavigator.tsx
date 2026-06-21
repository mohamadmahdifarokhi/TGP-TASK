/**
 * RootNavigator — the top-level navigator that guards protected screens.
 *
 * It reads the coarse session `status` from the Auth_Store and renders one of
 * three things inside a single {@link NavigationContainer}:
 *   - `unknown`         → a neutral splash (centered ActivityIndicator) shown
 *                         while the store hydrates from secure storage.
 *   - `authenticated`   → {@link AppTabs} (the full app shell).
 *   - `unauthenticated` → {@link AuthStack} (the OTP sign-in flow).
 *
 * This switch is the single authorization gate for the app: because the app
 * tabs are only mounted while `status === 'authenticated'`, an unauthenticated
 * session can never navigate to any protected screen — there is simply no
 * navigator route to one. When the session changes (verify-otp
 * success, logout, or a refresh failure clearing the session) the store status
 * changes and this component swaps the mounted tree accordingly.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import { useAuthStore } from '@/store/authStore';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';

/** Neutral splash shown while the Auth_Store status is still `unknown`. */
function SplashScreen(): React.ReactElement {
  return (
    <View style={styles.splash} testID="root-splash">
      <ActivityIndicator size="large" color="#1f6feb" />
    </View>
  );
}

export function RootNavigator(): React.ReactElement {
  const status = useAuthStore((s) => s.status);

  return (
    <NavigationContainer>
      {status === 'unknown' ? (
        <SplashScreen />
      ) : status === 'authenticated' ? (
        <AppTabs />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RootNavigator;
