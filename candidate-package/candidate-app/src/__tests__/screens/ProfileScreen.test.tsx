/**
 * Example/edge reference tests for ProfileScreen (SUPPLEMENTARY).
 *
 * Mocks the auth + users resource modules so the screen never hits the network.
 *  - happy: loads the current user via `auth.me` on mount and renders it
 *  - error+retry: a rejected `auth.me` shows the error state and Retry refetches
 *
 * Requirements: 9.1, 9.4, 10.3, 10.4
 */
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';

import type { ApiError, AuthUser } from '../../api/types';

jest.mock('../../api/auth.api');
jest.mock('../../api/users.api');
import * as authApi from '../../api/auth.api';
import * as usersApi from '../../api/users.api';

import ProfileScreen from '../../screens/profile/ProfileScreen';

const mockedMe = authApi.me as jest.MockedFunction<typeof authApi.me>;
const mockedTokenBalance = usersApi.tokenBalance as jest.MockedFunction<
  typeof usersApi.tokenBalance
>;

function makeUser(): AuthUser {
  return {
    id: 'u1',
    phoneNumber: '09123456789',
    avatar: null,
    role: 'user',
    isSubscribed: true,
    subscriptionExpiresAt: null,
  };
}

describe('ProfileScreen (example/edge reference tests)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls auth.me on mount and renders the user (happy path)', async () => {
    mockedMe.mockResolvedValueOnce(makeUser());
    mockedTokenBalance.mockResolvedValueOnce({ balance: 42 });

    const { getByTestId, getByText } = render(<ProfileScreen />);

    await waitFor(() => expect(getByTestId('profile-screen')).toBeTruthy());

    expect(mockedMe).toHaveBeenCalledTimes(1);
    expect(getByText('09123456789')).toBeTruthy();
    expect(getByTestId('profile-token-balance')).toBeTruthy();
  });

  it('shows error state and refetches on Retry when auth.me fails (edge: error+retry)', async () => {
    const apiError: ApiError = { status: 401, message: 'Session expired' };
    mockedMe.mockRejectedValueOnce(apiError).mockResolvedValueOnce(makeUser());
    mockedTokenBalance.mockResolvedValue({ balance: 7 });

    const { getByTestId, getByText } = render(<ProfileScreen />);

    await waitFor(() => expect(getByTestId('state-view-error')).toBeTruthy());
    expect(getByText('Session expired')).toBeTruthy();

    fireEvent.press(getByTestId('state-view-retry'));

    await waitFor(() => expect(getByTestId('profile-screen')).toBeTruthy());
    expect(mockedMe).toHaveBeenCalledTimes(2);
  });
});
