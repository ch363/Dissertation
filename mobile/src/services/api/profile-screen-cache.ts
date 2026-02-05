import { getAllMastery } from './mastery';
import { getMyProfile, getDashboard } from './profile';
import { getProgressSummary } from './progress';
import { DEFAULT_CACHE_TTL_MS, DEFAULT_DASHBOARD_DATA } from './defaults';

import { CacheManager } from '@/services/cache/cache-utils';
import { createLogger } from '@/services/logging';

const logger = createLogger('ProfileScreenCache');

export interface ProfileScreenCacheData {
  profile: Awaited<ReturnType<typeof getMyProfile>>;
  dashboard: Awaited<ReturnType<typeof getDashboard>>;
  progress: Awaited<ReturnType<typeof getProgressSummary>>;
  mastery: Awaited<ReturnType<typeof getAllMastery>>;
}

const cache = new CacheManager<ProfileScreenCacheData>(DEFAULT_CACHE_TTL_MS);

export async function preloadProfileScreenData(profileId: string | null): Promise<void> {
  try {
    const [profile, dashboard, mastery] = await Promise.all([
      getMyProfile().catch(() => null),
      getDashboard().catch(() => DEFAULT_DASHBOARD_DATA),
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
