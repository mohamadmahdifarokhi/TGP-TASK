/**
 * Example/edge reference tests for PhoneScreen (SUPPLEMENTARY).
 *
 * Mocks the auth resource module so the screen never hits the network.
 *  - happy: a valid number submit calls `sendOtp` and navigates to Otp (Req 3.1, 3.3)
 *  - edge: an invalid number shows a validation message and makes NO call (Req 3.2)
 *  - edge: a send failure surfaces an error message (Req 2.4 / error handling)
 *
 * Requirements: 3.1, 3.3
 */
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';

import type { ApiError } from '../../api/types';

jest.mock('@/api/auth.api');
import { sendOtp } from '@/api/auth.api';

import PhoneScreen from '../../screens/auth/PhoneScreen';

const mockedSendOtp = sendOtp as jest.MockedFunction<typeof sendOtp>;

function makeNavigation() {
  return { navigate: jest.fn() };
}

describe('PhoneScreen (example/edge reference tests)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls sendOtp and navigates to Otp on a valid submit (happy path)', async () => {
    mockedSendOtp.mockResolvedValueOnce({
      message: 'sent',
      phoneNumber: '09123456789',
      expiresIn: 300,
    });
    const navigation = makeNavigation();

    const { getByTestId } = render(<PhoneScreen navigation={navigation} />);

    fireEvent.changeText(getByTestId('phone-input'), '09123456789');
    fireEvent.press(getByTestId('phone-submit'));

    await waitFor(() => expect(mockedSendOtp).toHaveBeenCalledWith('09123456789'));
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('Otp', {
        phoneNumber: '09123456789',
      })
    );
  });

  it('shows a validation message and does NOT call sendOtp for an invalid number (edge)', async () => {
    const navigation = makeNavigation();

    const { getByTestId } = render(<PhoneScreen navigation={navigation} />);

    fireEvent.changeText(getByTestId('phone-input'), '12345');
    fireEvent.press(getByTestId('phone-submit'));

    await waitFor(() => expect(getByTestId('phone-validation-error')).toBeTruthy());
    expect(mockedSendOtp).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('surfaces a submit error when sendOtp rejects (edge: error)', async () => {
    const apiError: ApiError = { status: 0, message: 'Network down' };
    mockedSendOtp.mockRejectedValueOnce(apiError);
    const navigation = makeNavigation();

    const { getByTestId } = render(<PhoneScreen navigation={navigation} />);

    fireEvent.changeText(getByTestId('phone-input'), '09123456789');
    fireEvent.press(getByTestId('phone-submit'));

    await waitFor(() => expect(getByTestId('phone-submit-error')).toBeTruthy());
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
