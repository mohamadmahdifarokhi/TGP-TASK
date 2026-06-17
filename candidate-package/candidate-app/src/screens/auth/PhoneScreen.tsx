/**
 * PhoneScreen — first step of the OTP sign-in flow.
 *
 * The user enters an Iranian mobile number. Before any network call the input
 * is validated client-side; only a canonically valid `09xxxxxxxxx` number
 * triggers `POST /auth/send-otp`. On success the flow advances to
 * {@link OtpScreen}, passing the (normalized) phone number along so OTP
 * verification targets the same number.
 *
 * Requirements honored here:
 *  - 3.1: On submit of a valid number, call `sendOtp(phoneNumber)`.
 *  - 3.2: If the number is not a valid Iranian format, show a validation
 *         message and do NOT call the backend.
 *  - 3.3: On a confirmed send, navigate to the 6-digit OTP entry screen.
 *  - 3.7: While the send request is in flight, disable the submit control to
 *         prevent duplicate submissions.
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { sendOtp } from '@/api/auth.api';
import type { ApiError } from '@/api/types';
import { isValidIranPhone, normalizeIranPhone } from '@/utils/phone';

/**
 * Navigation param list for the auth stack.
 *
 * Defined and exported here so this screen compiles independently of the
 * navigator (authored in task 9.6). The navigator (`AuthStack`) should import
 * this type rather than redeclaring it, keeping the route contract in one place.
 */
export type AuthStackParamList = {
  /** Phone entry screen — no params. */
  Phone: undefined;
  /** OTP entry screen — carries the phone number to verify against. */
  Otp: { phoneNumber: string };
};

/** User-facing validation message for a malformed phone number (Req 3.2). */
export const PHONE_VALIDATION_MESSAGE =
  'Please enter a valid Iranian mobile number (09xxxxxxxxx).';

/**
 * Props are intentionally loosely typed (`any`) for the `navigation` object so
 * this screen does not depend on the not-yet-authored navigator. Once 9.6 wires
 * the stack, it can pass a `NativeStackScreenProps<AuthStackParamList, 'Phone'>`
 * here without changes.
 */
export type PhoneScreenProps = {
  navigation: any;
};

export function PhoneScreen({ navigation }: PhoneScreenProps): React.ReactElement {
  const [phone, setPhone] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    // Guard against duplicate submissions while a request is in flight (Req 3.7).
    if (submitting) {
      return;
    }

    setSubmitError(null);

    // Normalize loose input (+98/0098/98 prefixes, separators) to the canonical
    // form, then validate. If the input cannot be normalized to a valid number,
    // show a validation message and make NO backend call (Req 3.2).
    const normalized = normalizeIranPhone(phone) ?? phone.trim();
    if (!isValidIranPhone(normalized)) {
      setValidationError(PHONE_VALIDATION_MESSAGE);
      return;
    }

    setValidationError(null);
    setSubmitting(true);
    try {
      // Valid number → request the OTP (Req 3.1).
      await sendOtp(normalized);
      // Backend confirmed the send → advance to OTP entry (Req 3.3), carrying
      // the same normalized number so verify-otp targets it.
      navigation.navigate('Otp', { phoneNumber: normalized });
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(
        typeof apiError?.message === 'string' && apiError.message.trim().length > 0
          ? apiError.message
          : 'Could not send the verification code. Please try again.'
      );
    } finally {
      // Always re-enable the control, whether the request succeeded or failed.
      setSubmitting(false);
    }
  }, [navigation, phone, submitting]);

  const handleChange = useCallback((next: string) => {
    setPhone(next);
    // Clear stale errors as the user edits.
    setValidationError(null);
    setSubmitError(null);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>
        Enter your mobile number to receive a verification code.
      </Text>

      <TextInput
        accessibilityLabel="Phone number"
        testID="phone-input"
        style={styles.input}
        value={phone}
        onChangeText={handleChange}
        placeholder="09123456789"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        editable={!submitting}
        maxLength={20}
        onSubmitEditing={handleSubmit}
        returnKeyType="send"
      />

      {validationError ? (
        <Text style={styles.errorText} testID="phone-validation-error">
          {validationError}
        </Text>
      ) : null}

      {submitError ? (
        <Text style={styles.errorText} testID="phone-submit-error">
          {submitError}
        </Text>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Send verification code"
        accessibilityState={{ disabled: submitting }}
        testID="phone-submit"
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#ffffff" testID="phone-submit-spinner" />
        ) : (
          <Text style={styles.buttonText}>Send code</Text>
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
    fontSize: 18,
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

export default PhoneScreen;
