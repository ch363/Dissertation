/**
 * Shared TTS and preferences mocks for tests
 */

/**
 * Mock TTS service
 */
export const mockTts = {
  speak: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
};

/**
 * Mock preferences service
 */
export const mockPreferences = {
  getTtsEnabled: jest.fn(() => Promise.resolve(true)),
  getTtsRate: jest.fn(() => Promise.resolve(1.0)),
  setTtsEnabled: jest.fn(() => Promise.resolve()),
  setTtsRate: jest.fn(() => Promise.resolve()),
};

/**
 * Setup TTS and preferences mocks
 * Usage:
 * ```ts
 * setupTtsMocks();
 * ```
 */
export function setupTtsMocks() {
  jest.mock('@/services/tts', () => mockTts);

  jest.mock('@/services/preferences', () => mockPreferences);
}
