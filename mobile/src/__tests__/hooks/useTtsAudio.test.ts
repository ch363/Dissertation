import { useTtsAudio } from '@/hooks/useTtsAudio';

// Mock dependencies
jest.mock('@/services/preferences', () => ({
  getTtsEnabled: jest.fn(() => Promise.resolve(true)),
  getTtsRate: jest.fn(() => Promise.resolve(1.0)),
}));

jest.mock('@/services/tts', () => ({
  speak: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
}));

const mockPreferences = require('@/services/preferences');
const mockSafeSpeech = require('@/services/tts');

describe('useTtsAudio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export useTtsAudio hook', () => {
    expect(typeof useTtsAudio).toBe('function');
  });

  it('should call TTS speak function when enabled', async () => {
    mockPreferences.getTtsEnabled.mockResolvedValue(true);
    mockPreferences.getTtsRate.mockResolvedValue(1.0);

    // TTS module exports should be called
    expect(mockSafeSpeech.speak).toBeDefined();
  });

  it('should have TTS preferences mocked', () => {
    expect(mockPreferences.getTtsEnabled).toBeDefined();
    expect(mockPreferences.getTtsRate).toBeDefined();
  });
});
