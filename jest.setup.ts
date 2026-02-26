// Minimal test setup: polyfill global fetch to avoid "fetch is not defined" in Jest/jsdom
// This polyfill returns a benign empty successful response by default; tests that need
// specific responses should mock `global.fetch` or use testing-library mocks.

if (typeof globalThis.fetch === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = async function () {
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
    };
  };
}

// Helpful DOM extensions
import '@testing-library/jest-dom';
