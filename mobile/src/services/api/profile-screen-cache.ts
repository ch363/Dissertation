import { getMyProfile, getDashboard, getRecentActivity } from './profile';
import { getProgressSummary } from './progress';
import { getAllMastery } from './mastery';

export interface ProfileScreenCacheData {
  profile: Awaited<ReturnType<typeof getMyProfile>>;
  dashboard: Awaited<ReturnType<typeof getDashboard>>;
  recentActivity: Awaited<ReturnType<typeof getRecentActivity>>;
  progress: Awaited<ReturnType<typeof getProgressSummary>>;
  mastery: Awaited<ReturnType<typeof getAllMastery>>;
  timestamp: number;
}

/**
 * Simple cache for preloaded Profile screen data
 * Key: 'profile-screen', Value: { data, timestamp }
 */
const cache = new Map<string, ProfileScreenCacheData>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if cached data is still valid
 */
function isCacheValid(cached: ProfileScreenCacheData | undefined): boolean {
  if (!cached) return false;
  const age = Date.now() - cached.timestamp;
  return age < CACHE_TTL;
}

/**
 * Preload Profile screen data in the background
 * This should be called after user authentication
 */
export async function preloadProfileScreenData(profileId: string | null): Promise<void> {
  try {
    const [profile, dashboard, recentActivity, mastery] = await Promise.all([
      getMyProfile().catch(() => null),
      getDashboard().catch(() => ({ streak: 0, dueReviewCount: 0, activeLessonCount: 0, xpTotal: 0 })),
      getRecentActivity().catch(() => null),
      getAllMastery().catch(() => []),
    ]);

    const progress = await getProgressSummary(profileId || null).catch(() => ({
      xp: 0,
      streak: 0,
      completedLessons: 0,
      completedModules: 0,
      totalLessons: 0,
      totalModules: 0,
      dueReviewCount: 0,
    }));

    cache.set('profile-screen', {
      profile,
      dashboard,
      recentActivity,
      progress,
      mastery,
      timestamp: Date.now(),
    });

    console.log('Profile screen data preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload Profile screen data (non-critical):', error);
    // Silently fail - preloading is best effort
  }
}

/**
 * Get cached Profile screen data if available and valid
 */
export function getCachedProfileScreenData(): ProfileScreenCacheData | null {
  const cached = cache.get('profile-screen');
  if (isCacheValid(cached)) {
    return cached;
  }
  return null;
}

/**
 * Clear the Profile screen cache
 */
export function clearProfileScreenCache(): void {
  cache.clear();
}
