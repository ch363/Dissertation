import { useProfileData } from '@/features/profile/hooks/useProfileData';

// Mock API calls
jest.mock('@/services/api/profile', () => ({
  getMyProfile: jest.fn(() =>
    Promise.resolve({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    }),
  ),
}));

jest.mock('@/services/api/progress', () => ({
  getDashboard: jest.fn(() =>
    Promise.resolve({
      currentStreak: 5,
      longestStreak: 10,
      totalXp: 1000,
      level: 3,
    }),
  ),
  getProgressSummary: jest.fn(() =>
    Promise.resolve({
      totalTeachings: 50,
      completedTeachings: 30,
    }),
  ),
}));

jest.mock('@/services/api/mastery', () => ({
  getAllMastery: jest.fn(() => Promise.resolve([])),
}));

describe('useProfileData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export useProfileData hook', () => {
    expect(typeof useProfileData).toBe('function');
  });
});
