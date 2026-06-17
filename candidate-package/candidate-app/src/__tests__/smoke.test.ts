/**
 * Trivial smoke test confirming the Jest runner, TypeScript transform, and the
 * shared in-memory mocks are wired up correctly for the starter.
 */
import { createHttpMock } from './helpers/httpMock';

describe('test runner smoke check', () => {
  it('runs and asserts true', () => {
    expect(true).toBe(true);
  });

  it('exposes the in-memory expo-secure-store mock', async () => {
    // expo-secure-store is mocked to an in-memory Map in jest.setup.js.
    const secureStore = require('expo-secure-store');
    await secureStore.setItemAsync('token', 'abc123');
    await expect(secureStore.getItemAsync('token')).resolves.toBe('abc123');
    await secureStore.deleteItemAsync('token');
    await expect(secureStore.getItemAsync('token')).resolves.toBeNull();
  });

  it('provides a configurable in-memory HTTP transport mock', async () => {
    const http = createHttpMock();
    http.on('GET', '/games', { status: 200, data: { data: [], total: 0 } });

    const res = await http.request({ method: 'get', url: '/games' });

    expect(res.status).toBe(200);
    expect(http.calls).toHaveLength(1);
    expect(http.calls[0].url).toBe('/games');
  });
});
