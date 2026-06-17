/**
 * AuthStack — the unauthenticated navigation stack.
 *
 * A native-stack containing the two screens of the OTP sign-in flow:
 *   - `Phone` → enter a mobile number and request an OTP (Req 3.1–3.3).
 *   - `Otp`   → enter the 6-digit code and verify it (Req 3.4–3.6).
 *
 * The route contract ({@link AuthStackParamList}) is authored alongside
 * {@link PhoneScreen}; we import it here rather than redeclaring it so the
 * navigator and screens share a single source of truth.
 *
 * This stack is only ever mounted by {@link RootNavigator} while the session is
 * `unauthenticated`. Once `verify-otp` succeeds the Auth_Store flips to
 * `authenticated` and the root navigator swaps this stack out for the app tabs,
 * so there is no in-stack route from here into any protected screen (Req 4.7).
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import PhoneScreen, { type AuthStackParamList } from '@/screens/auth/PhoneScreen';
import OtpScreen from '@/screens/auth/OtpScreen';

/** Re-export the auth route contract so callers can import it from the navigator. */
export type { AuthStackParamList } from '@/screens/auth/PhoneScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack(): React.ReactElement {
  return (
    <Stack.Navigator initialRouteName="Phone" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen
        name="Otp"
        component={OtpScreen}
        options={{ headerShown: true, title: 'Verify code' }}
      />
    </Stack.Navigator>
  );
}

export default AuthStack;
