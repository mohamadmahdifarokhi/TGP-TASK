/**
 * Example/edge reference tests for VideoPlayerScreen (SUPPLEMENTARY).
 *
 * Mocks the videos + watch-history resource modules so the screen never hits
 * the network.
 *  - happy: loads the video on mount and renders the player (Req 7.1)
 *  - access-denied: `validate-access` hasAccess=false shows the blocked message
 *    instead of a play control (Req 7.3)
 *  - error: a rejected load surfaces the error state (no hang) (Req 2.4)
 *
 * Requirements: 7.1, 7.3, 2.4
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import type { ApiError, ValidateAccessRes, Video } from '../../api/types';

jest.mock('../../api/videos.api');
jest.mock('../../api/watchHistory.api');
import videosApi from '../../api/videos.api';

import VideoPlayerScreen from '../../screens/video/VideoPlayerScreen';

const mockedGet = videosApi.get as jest.MockedFunction<typeof videosApi.get>;
const mockedValidate = videosApi.validateAccess as jest.MockedFunction<
  typeof videosApi.validateAccess
>;

function makeVideo(): Video {
  return { id: 'v1', title: 'Sample Video', description: 'A clip' };
}

function route() {
  return { params: { videoId: 'v1' } };
}

describe('VideoPlayerScreen (example/edge reference tests)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads the video on mount and renders the player when access is granted (happy path)', async () => {
    mockedGet.mockResolvedValueOnce(makeVideo());
    const access: ValidateAccessRes = { hasAccess: true, message: '' };
    mockedValidate.mockResolvedValueOnce(access);

    const { getByTestId } = render(<VideoPlayerScreen route={route()} />);

    await waitFor(() => expect(getByTestId('video-player-screen')).toBeTruthy());
    expect(mockedGet).toHaveBeenCalledWith('v1');
    expect(mockedValidate).toHaveBeenCalledWith('v1');
    expect(getByTestId('video-player-play')).toBeTruthy();
  });

  it('shows the blocked message when access is denied (edge: access-denied)', async () => {
    mockedGet.mockResolvedValueOnce(makeVideo());
    const access: ValidateAccessRes = {
      hasAccess: false,
      message: 'Subscription required',
    };
    mockedValidate.mockResolvedValueOnce(access);

    const { getByTestId, getByText, queryByTestId } = render(
      <VideoPlayerScreen route={route()} />
    );

    await waitFor(() => expect(getByTestId('video-player-blocked')).toBeTruthy());
    expect(getByText('Subscription required')).toBeTruthy();
    expect(queryByTestId('video-player-play')).toBeNull();
  });

  it('surfaces a load failure as the error state without hanging (Req 2.4)', async () => {
    const apiError: ApiError = { status: 0, message: 'Request timed out' };
    mockedGet.mockRejectedValueOnce(apiError);
    mockedValidate.mockRejectedValueOnce(apiError);

    const { getByTestId, queryByTestId } = render(<VideoPlayerScreen route={route()} />);

    await waitFor(() => expect(getByTestId('state-view-error')).toBeTruthy());
    expect(queryByTestId('state-view-loading')).toBeNull();
  });
});
