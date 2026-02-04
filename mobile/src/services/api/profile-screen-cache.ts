import { getMyProfile, getDashboard } from './profile';
import { getProgressSummary } from './progress';
import { getAllMastery } from './mastery';
import { createLogger } from '@/services/logging';
import { CacheManager } from '@/services/cache/cache-utils';

const logger = createLogger('ProfileScreenCache');

export interface ProfileScreenCacheData {
  profile: Awaited<ReturnType<typeof getMyProfile>>;
  dashboard: Awaited<ReturnType<typeof getDashboard>>;
  progress: Awaited<ReturnType<typeof getProgressSummary>>;
  mastery: Awaited<ReturnType<typeof getAllMastery>>;
}

const cache = new CacheManager<ProfileScreenCacheData>(5 * 60 * 1000);

export async function preloadProfileScreenData(profileId: string | null): Promise<void> {
  try {
    const [profile, dashboard, mastery] = await Promise.all([
      getMyProfile().catch(() => null),
      getDashboard().catch(() => ({
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
      })),
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
      progress,
      mastery,
    });
  } catch (error) {
    logger.warn('Failed to preload Profile screen data (non-critical)', error);
  }
}

export function getCachedProfileScreenData(): ProfileScreenCacheData | null {
  return cache.get('profile-screen');
}

export function clearProfileScreenCache(): void {
  cache.clear();
}
