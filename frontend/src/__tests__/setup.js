/**
 * Vitest setup file – runs before every test file.
 *
 * - Imports @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
 * - Mocks browser APIs not available in jsdom (sessionStorage, matchMedia)
 * - Cleans up after each test.
 */

import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock sessionStorage
// ---------------------------------------------------------------------------
const createStorageMock = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index) => Object.keys(store)[index] ?? null),
  };
};

const sessionStorageMock = createStorageMock();
const localStorageMock = createStorageMock();

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ---------------------------------------------------------------------------
// Mock matchMedia (required by some UI libraries)
// ---------------------------------------------------------------------------
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ---------------------------------------------------------------------------
// Auto-cleanup after every test
// ---------------------------------------------------------------------------
afterEach(() => {
  cleanup();
  sessionStorageMock.clear();
  localStorageMock.clear();
  vi.clearAllMocks();
});
