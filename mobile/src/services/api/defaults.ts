import type { DashboardData } from './profile';

/**
 * Default dashboard data structure
 * Used as fallback when dashboard API calls fail
 */
export const DEFAULT_DASHBOARD_DATA: DashboardData = {
  streak: 0,
  dueReviewCount: 0,
  activeLessonCount: 0,
  xpTotal: 0,
  weeklyXP: 0,
  weeklyXPChange: 0,
  weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
  accuracyPercentage: 0,
  accuracyByDeliveryMethod: {},
  grammaticalAccuracyByDeliveryMethod: {},
  studyTimeMinutes: 0,
};

/**
 * Default cache TTL in milliseconds (5 minutes)
 * Used consistently across screen cache implementations
 */
export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
