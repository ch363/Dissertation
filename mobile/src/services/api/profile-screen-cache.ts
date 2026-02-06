import { getAllMastery } from './mastery';
import { getMyProfile, getDashboard } from './profile';
import { getProgressSummary } from './progress';
import { DEFAULT_DASHBOARD_DATA } from './defaults';

import {
  ScreenCacheService,
  safeApiCall,
} from '@/services/cache/screen-cache';

export interface ProfileScreenCacheData {
  profile: Awaited<ReturnType<typeof getMyProfile>>;
  dashboard: Awaited<ReturnType<typeof getDashboard>>;
  progress: Awaited<ReturnType<typeof getProgressSummary>>;
  mastery: Awaited<ReturnType<typeof getAllMastery>>;
}

const DEFAULT_PROGRESS = {
  xp: 0,
  streak: 0,
  completedLessons: 0,
  completedModules: 0,
  totalLessons: 0,
  totalModules: 0,
  dueReviewCount: 0,
};

const cacheService = new ScreenCacheService<ProfileScreenCacheData>(
  'profile-screen',
  'ProfileScreenCache',
);

export async function preloadProfileScreenData(
  profileId: string | null,
): Promise<void> {
  await cacheService.preload(async () => {
    const [profile, dashboard, mastery] = await Promise.all([
      safeApiCall(getMyProfile, null),
      safeApiCall(getDashboard, DEFAULT_DASHBOARD_DATA),
      safeApiCall(getAllMastery, []),
    ]);

    const progress = await safeApiCall(
      () => getProgressSummary(profileId || null),
      DEFAULT_PROGRESS,
    );

    return { profile, dashboard, progress, mastery };
  });
}

export function getCachedProfileScreenData(): ProfileScreenCacheData | null {
  return cacheService.getCached();
}

export function clearProfileScreenCache(): void {
  cacheService.clearAll();
}
