/**
 * Shared API service mocks for tests
 * Factory functions for common API mock implementations
 */

import type { Profile, DashboardData } from '@/services/api/profile';
import type { ProgressSummary } from '@/services/api/progress';

/**
 * Create a mock profile object
 */
export function createMockProfile(overrides?: Partial<Profile>): Profile {
  return {
    id: 'user-1',
    name: 'Test User',
    avatarUrl: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    displayName: 'Test User',
    ...overrides,
  };
}

/**
 * Create a mock dashboard data object
 */
export function createMockDashboardData(
  overrides?: Partial<DashboardData>,
): DashboardData {
  return {
    streak: 5,
    dueReviewCount: 10,
    activeLessonCount: 3,
    xpTotal: 1500,
    weeklyXP: 200,
    weeklyXPChange: 50,
    weeklyActivity: [20, 30, 40, 50, 30, 10, 20],
    accuracyPercentage: 85,
    accuracyByDeliveryMethod: {},
    grammaticalAccuracyByDeliveryMethod: {},
    studyTimeMinutes: 120,
    ...overrides,
  };
}

/**
 * Create a mock progress summary object
 */
export function createMockProgressSummary(
  overrides?: Partial<ProgressSummary>,
): ProgressSummary {
  return {
    xp: 1500,
    streak: 5,
    completedLessons: 10,
    completedModules: 2,
    totalLessons: 50,
    totalModules: 10,
    dueReviewCount: 15,
    ...overrides,
  };
}

/**
 * Setup common API mocks
 * Usage:
 * ```ts
 * setupApiMocks();
 * ```
 */
export function setupApiMocks() {
  jest.mock('@/services/api/profile', () => ({
    getMyProfile: jest.fn(() => Promise.resolve(createMockProfile())),
    getDashboard: jest.fn(() => Promise.resolve(createMockDashboardData())),
  }));

  jest.mock('@/services/api/progress', () => ({
    getProgressSummary: jest.fn(() => Promise.resolve(createMockProgressSummary())),
    getUserLessons: jest.fn(() => Promise.resolve([])),
  }));

  jest.mock('@/services/api/mastery', () => ({
    getAllMastery: jest.fn(() => Promise.resolve([])),
  }));

  jest.mock('@/services/api/learn', () => ({
    getSuggestions: jest.fn(() => Promise.resolve({ lessons: [], modules: [] })),
  }));
}
