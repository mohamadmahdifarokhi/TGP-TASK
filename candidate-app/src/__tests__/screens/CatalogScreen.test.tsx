/**
 * Example/edge reference tests for CatalogScreen (SUPPLEMENTARY).
 *
 * These lightweight tests mock the games resource module so the screen never
 * touches the network, then exercise representative happy/edge paths:
 *  - happy: calls `games.list` on mount and renders the returned GameCards
 *  - empty: an empty list surfaces the empty state message
 *  - error+retry: a rejected list shows the error state and Retry re-fetches
 *  - timeout/no-hang: a transport-style ApiError rejection surfaces as error
 *    (does not hang on the spinner) (Req 2.4)
 *
 * Requirements: 5.1, 5.4, 5.5, 2.4
 */
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';

import type { ApiError, Game, Paginated } from '../../api/types';

// Mock the games resource module so the screen never hits the network.
jest.mock('../../api/games.api');
import * as games from '../../api/games.api';

import CatalogScreen from '../../screens/catalog/CatalogScreen';

const mockedList = games.list as jest.MockedFunction<typeof games.list>;

function makeGame(id: string, title: string): Game {
  return {
    id,
    slug: id,
    title,
    description: '',
    thumbnail: null,
    categoryConfig: { name: 'Puzzle' },
  };
}

function paginated(items: Game[]): Paginated<Game> {
  return { data: items, total: items.length, page: 1, limit: 20 };
}

describe('CatalogScreen (example/edge reference tests)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls games.list on mount and renders the returned GameCards (happy path)', async () => {
    mockedList.mockResolvedValueOnce(
      paginated([makeGame('g1', 'Alpha Game'), makeGame('g2', 'Beta Game')])
    );

    const { getByTestId, getByText } = render(<CatalogScreen />);

    await waitFor(() => expect(getByTestId('catalog-list')).toBeTruthy());

    expect(mockedList).toHaveBeenCalledTimes(1);
    expect(getByText('Alpha Game')).toBeTruthy();
    expect(getByText('Beta Game')).toBeTruthy();
  });

  it('shows the empty state when the list is empty (edge: empty)', async () => {
    mockedList.mockResolvedValueOnce(paginated([]));

    const { getByTestId } = render(<CatalogScreen />);

    await waitFor(() => expect(getByTestId('state-view-empty')).toBeTruthy());
    expect(getByTestId('state-view-empty-message')).toBeTruthy();
  });

  it('shows error state and re-fetches when Retry is pressed (edge: error+retry)', async () => {
    const apiError: ApiError = { status: 500, message: 'Server is down' };
    mockedList
      .mockRejectedValueOnce(apiError)
      .mockResolvedValueOnce(paginated([makeGame('g1', 'Recovered Game')]));

    const { getByTestId, getByText } = render(<CatalogScreen />);

    await waitFor(() => expect(getByTestId('state-view-error')).toBeTruthy());
    expect(getByText('Server is down')).toBeTruthy();

    fireEvent.press(getByTestId('state-view-retry'));

    await waitFor(() => expect(getByTestId('catalog-list')).toBeTruthy());
    expect(getByText('Recovered Game')).toBeTruthy();
    expect(mockedList).toHaveBeenCalledTimes(2);
  });

  it('surfaces a timeout/transport failure as the error state without hanging (Req 2.4)', async () => {
    // status 0 models a transport failure (timeout / no network) mapped to ApiError.
    const timeoutError: ApiError = { status: 0, message: 'Request timed out' };
    mockedList.mockRejectedValueOnce(timeoutError);

    const { getByTestId, queryByTestId } = render(<CatalogScreen />);

    await waitFor(() => expect(getByTestId('state-view-error')).toBeTruthy());
    // The loading spinner must NOT still be present (no hang).
    expect(queryByTestId('state-view-loading')).toBeNull();
  });
});
