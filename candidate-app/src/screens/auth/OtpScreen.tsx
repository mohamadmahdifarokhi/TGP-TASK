/**
 * OtpScreen — second step of the OTP sign-in flow.
 *
 * The user enters the 6-digit code sent to their phone number (received as a
 * route param from {@link PhoneScreen}). On submit the code is verified against
 * the backend; on success the returned tokens + user are written to the
 * Auth_Store, which flips the session to `authenticated` and lets the navigator
 * switch to the app. On rejection (invalid/expired) an error is shown and the
 * user can re-enter the code.
 *
 * Requirements honored here:
 *  - 3.4: On submit of a 6-digit code, call `verifyOtp(phoneNumber, otp)`.
 *  - 3.5: On success, persist tokens + user via `useAuthStore.setSession(...)`.
 *  - 3.6: On invalid/expired OTP, show an error and allow re-entry.
 *  - 3.7: While the verify request is in flight, disable the submit control.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { verifyOtp } from '@/api/auth.api';
import type { ApiError } from '@/api/types';
import { OTP_LENGTH } from '@/config';
import { useAuthStore } from '@/store/authStore';

import type { AuthStackParamList } from './PhoneScreen';

/** Re-export so the navigator can import the param list from either auth screen. */
export type { AuthStackParamList } from './PhoneScreen';

/**
 * Loosely-typed props so this screen compiles independently of the navigator
 * (authored in task 9.6). `route.params.phoneNumber` is supplied by
 * {@link PhoneScreen} when it navigates here. Once 9.6 wires the stack it can
 * pass `NativeStackScreenProps<AuthStackParamList, 'Otp'>` without changes.
 */
export type OtpScreenProps = {
  navigation: any;
  route: { params?: { phoneNumber?: string } };
};

/** Keep only digits and cap the length at the configured OTP size. */
function sanitizeOtp(input: string): string {
  return input.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export function OtpScreen({ route }: OtpScreenProps): React.ReactElement {
  const phoneNumber = route?.params?.phoneNumber ?? '';
  const setSession = useAuthStore((s) => s.setSession);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The code is submittable only when it is exactly OTP_LENGTH digits.
  const isComplete = useMemo(() => otp.length === OTP_LENGTH, [otp]);

  const handleChange = useCallback((next: string) => {
    setOtp(sanitizeOtp(next));
    // Clear a stale error as the user re-enters the code (Req 3.6).
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    // Guard against duplicate submissions while a request is in flight (Req 3.7).
    if (submitting) {
      return;
    }
    if (!isComplete) {
      setError(`Please enter the ${OTP_LENGTH}-digit code.`);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      // Verify the code for the phone number passed from PhoneScreen (Req 3.4).
      const result = await verifyOtp(phoneNumber, otp);
      // Persist tokens + user; this marks the session authenticated (Req 3.5).
      await setSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
      // No explicit navigation: the root navigator switches stacks on the
      // Auth_Store status change to `authenticated` (Req 4.7, wired in 9.6).
    } catch (err) {
      // Invalid/expired (or any failure): show the message and keep the screen
      // so the user can re-enter the code (Req 3.6).
      const apiError = err as ApiError;
      setError(
        typeof apiError?.message === 'string' && apiError.message.trim().length > 0
          ? apiError.message
          : 'The code is invalid or expired. Please try again.'
      );
    } finally {
      // Always re-enable so the user can retry after a failure.
      setSubmitting(false);
    }
  }, [isComplete, otp, phoneNumber, setSession, submitting]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter code</Text>
      <Text style={styles.subtitle}>
        {phoneNumber
          ? `We sent a ${OTP_LENGTH}-digit code to ${phoneNumber}.`
          : `Enter the ${OTP_LENGTH}-digit code we sent you.`}
      </Text>

      <TextInput
        accessibilityLabel="Verification code"
        testID="otp-input"
        style={styles.input}
        value={otp}
        onChangeText={handleChange}
        placeholder={'0'.repeat(OTP_LENGTH)}
        keyboardType="number-pad"
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        editable={!submitting}
        maxLength={OTP_LENGTH}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />

      {error ? (
        <Text style={styles.errorText} testID="otp-error">
          {error}
        </Text>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Verify code"
        accessibilityState={{ disabled: submitting || !isComplete }}
        testID="otp-submit"
        style={[
          styles.button,
          (submitting || !isComplete) && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={submitting || !isComplete}
      >
        {submitting ? (
          <ActivityIndicator color="#ffffff" testID="otp-submit-spinner" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    color: '#b00020',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#1f6feb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9bb8e8',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OtpScreen;
