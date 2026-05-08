// src/setupTests.js
// ─────────────────────────────────────────────────────────────────
// CRA's Jest entry point (react-scripts picks this up automatically).
// Bootstraps:
//   - @testing-library/jest-dom custom matchers
//   - MSW server lifecycle (start / reset / close)
//   - global browser API stubs (matchMedia, IntersectionObserver, ResizeObserver)
// ─────────────────────────────────────────────────────────────────
import '@testing-library/jest-dom';
import { server } from './tests/mocks/server';

// ── MSW lifecycle ──────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── window.matchMedia stub (JSDOM doesn't implement it) ────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ── IntersectionObserver stub ──────────────────────────────────────
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ── ResizeObserver stub ────────────────────────────────────────────
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ── Suppress console.error noise in tests ─────────────────────────
const originalError = console.error.bind(console);
beforeAll(() => {
  console.error = (...args) => {
    const msg = args[0]?.toString?.() ?? '';
    if (
      msg.includes('Warning: ReactDOM.render') ||
      msg.includes('Warning: An update to') ||
      msg.includes('not wrapped in act')
    ) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
