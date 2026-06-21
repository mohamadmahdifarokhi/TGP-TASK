/**
 * Example/edge reference tests for OtpScreen (SUPPLEMENTARY).
 *
 * Mocks the auth resource module so the screen never hits the network.
 *  - happy: a 6-digit submit calls `verifyOtp` and persists the session
 *  - edge: an invalid/expired OTP shows an error and allows re-entry
 *
 * Requirements: 3.6
 */
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';

import type { ApiError } from '../../api/types';

jest.mock('@/api/auth.api');
import { verifyOtp } from '@/api/auth.api';

import { useAuthStore } from '@/store/authStore';
import OtpScreen from '../../screens/auth/OtpScreen';

const mockedVerifyOtp = verifyOtp as jest.MockedFunction<typeof verifyOtp>;

function makeRoute() {
  return { params: { phoneNumber: '09123456789' } };
}

describe('OtpScreen (example/edge reference tests)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls verifyOtp and persists the session on a valid 6-digit submit (happy path)', async () => {
    mockedVerifyOtp.mockResolvedValueOnce({
      user: {
        id: 'u1',
        phoneNumber: '09123456789',
        avatar: null,
        role: 'user',
        isSubscribed: false,
        subscriptionExpiresAt: null,
      },
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });

    const navigation = { navigate: jest.fn() };
    const { getByTestId } = render(
      <OtpScreen navigation={navigation} route={makeRoute()} />
    );

    fireEvent.changeText(getByTestId('otp-input'), '123456');
    fireEvent.press(getByTestId('otp-submit'));

    await waitFor(() =>
      expect(mockedVerifyOtp).toHaveBeenCalledWith('09123456789', '123456')
    );
    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe('authenticated')
    );
    expect(useAuthStore.getState().accessToken).toBe('access-1');
  });

  it('shows an error and keeps the screen for re-entry on invalid OTP (edge)', async () => {
    const apiError: ApiError = { status: 400, message: 'Code is invalid or expired' };
    mockedVerifyOtp.mockRejectedValueOnce(apiError);

    const navigation = { navigate: jest.fn() };
    const { getByTestId, getByText } = render(
      <OtpScreen navigation={navigation} route={makeRoute()} />
    );

    fireEvent.changeText(getByTestId('otp-input'), '000000');
    fireEvent.press(getByTestId('otp-submit'));

    await waitFor(() => expect(getByTestId('otp-error')).toBeTruthy());
    expect(getByText('Code is invalid or expired')).toBeTruthy();
    // Input is still present so the user can re-enter the code.
    expect(getByTestId('otp-input')).toBeTruthy();
  });
});
