import { useHomeData } from '@/features/home/hooks/useHomeData';

// Mock API calls
jest.mock('@/services/api/modules', () => ({
  getModules: jest.fn(() => Promise.resolve([])),
  getLessons: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/services/api/progress', () => ({
  getDashboard: jest.fn(() =>
    Promise.resolve({
      currentStreak: 0,
      longestStreak: 0,
      totalXp: 0,
      level: 1,
    }),
  ),
  getDueReviews: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/services/api/mastery', () => ({
  getAllMastery: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/services/api/profile', () => ({
  getMyProfile: jest.fn(() => Promise.resolve({ id: 'user-1', name: 'Test' })),
}));

jest.mock('@/services/api/learn', () => ({
  getSuggestions: jest.fn(() => Promise.resolve({ lessons: [], modules: [] })),
}));

describe('useHomeData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export useHomeData hook', () => {
    expect(typeof useHomeData).toBe('function');
  });
});
