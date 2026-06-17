// Jest setup file for the candidate-app starter.
//
// Wires up the testing framework used across the starter's test suite:
//   1. React Native Testing Library matchers (jest-native style `toBeOnTheScreen`,
//      `toHaveTextContent`, etc.). Since @testing-library/react-native v12.4 the
//      matchers are auto-extended on import, but we extend defensively so the
//      setup works regardless of the installed minor version.
//   2. An in-memory mock for `expo-secure-store` so the Auth_Store persistence
//      tests never touch native secure storage. Backed by a simple Map that is
//      reset between tests.
//
// The in-memory HTTP transport mock lives in `src/__tests__/helpers/` so tests
// can import and configure it per-suite (the real API client is built in a
// later task, so the helper is intentionally transport-agnostic).

// 1) Extend React Native Testing Library matchers (best-effort / version-safe).
try {
  // v12.4+ exposes matchers here; older versions used '@testing-library/jest-native'.
  require('@testing-library/react-native/extend-expect');
} catch (_e) {
  try {
    require('@testing-library/jest-native/extend-expect');
  } catch (_e2) {
    // Matchers are auto-registered by @testing-library/react-native on import in
    // recent versions; nothing further to do.
  }
}

// 2) In-memory mock for expo-secure-store.
// A module-level Map stands in for the device secure store. The mock mirrors the
// async API surface the Auth_Store uses: getItemAsync / setItemAsync /
// deleteItemAsync. The store is exposed via `__store` for assertions and is
// cleared before every test for isolation.
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    __store: store,
    getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, String(value));
    }),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
    isAvailableAsync: jest.fn(async () => true),
  };
});

// Reset the in-memory secure-store and all mock call records between tests so
// each test starts from a clean, isolated state.
beforeEach(() => {
  try {
    const secureStore = require('expo-secure-store');
    if (secureStore.__store && typeof secureStore.__store.clear === 'function') {
      secureStore.__store.clear();
    }
  } catch (_e) {
    // expo-secure-store not resolvable in this environment; nothing to reset.
  }
  jest.clearAllMocks();
});
