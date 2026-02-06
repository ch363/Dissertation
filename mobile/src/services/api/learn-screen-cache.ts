import { getSuggestions } from './learn';
import { getLessons, getModules } from './modules';
import { getDashboard } from './profile';
import { getUserLessons } from './progress';
import { DEFAULT_DASHBOARD_DATA } from './defaults';

import {
  ScreenCacheService,
  safeApiCall,
} from '@/services/cache/screen-cache';

export interface LearnScreenCacheData {
  modules: Awaited<ReturnType<typeof getModules>>;
  lessons: Awaited<ReturnType<typeof getLessons>>;
  userProgress: Awaited<ReturnType<typeof getUserLessons>>;
  dashboard: Awaited<ReturnType<typeof getDashboard>>;
  suggestions: Awaited<ReturnType<typeof getSuggestions>>;
}

const cacheService = new ScreenCacheService<LearnScreenCacheData>(
  'learn-screen',
  'LearnScreenCache',
);

export async function preloadLearnScreenData(): Promise<void> {
  await cacheService.preload(async () => {
    const [modules, lessons, userProgress, dashboard, suggestions] =
      await Promise.all([
        safeApiCall(getModules, []),
        safeApiCall(getLessons, []),
        safeApiCall(getUserLessons, []),
        safeApiCall(getDashboard, DEFAULT_DASHBOARD_DATA),
        safeApiCall(() => getSuggestions({ limit: 8 }), {
          lessons: [],
          modules: [],
        }),
      ]);

    return { modules, lessons, userProgress, dashboard, suggestions };
  });
}

export function getCachedLearnScreenData(): LearnScreenCacheData | null {
  return cacheService.getCached();
}

export function getCachedModules(): LearnScreenCacheData['modules'] | null {
  const cached = getCachedLearnScreenData();
  return cached ? cached.modules : null;
}

export function clearLearnScreenCache(): void {
  cacheService.clearAll();
}
