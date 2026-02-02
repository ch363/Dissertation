import { getDashboard } from './profile';
import { getSuggestions } from './learn';
import { getLessons, getModules } from './modules';
import { getUserLessons } from './progress';
import { createLogger } from '@/services/logging';
import { CacheManager } from '@/services/cache/cache-utils';

const logger = createLogger('LearnScreenCache');

export interface LearnScreenCacheData {
  modules: Awaited<ReturnType<typeof getModules>>;
  lessons: Awaited<ReturnType<typeof getLessons>>;
  userProgress: Awaited<ReturnType<typeof getUserLessons>>;
  dashboard: Awaited<ReturnType<typeof getDashboard>>;
  suggestions: Awaited<ReturnType<typeof getSuggestions>>;
}

const cache = new CacheManager<LearnScreenCacheData>(5 * 60 * 1000);

export async function preloadLearnScreenData(): Promise<void> {
  try {
    const [modules, lessons, userProgress, dashboard, suggestions] = await Promise.all([
      getModules().catch(() => []),
      getLessons().catch(() => []),
      getUserLessons().catch(() => []),
      getDashboard().catch(() => ({ streak: 0, dueReviewCount: 0, activeLessonCount: 0, xpTotal: 0 })),
      getSuggestions({ limit: 8 }).catch(() => ({ lessons: [], modules: [] })),
    ]);

    cache.set('learn-screen', {
      modules,
      lessons,
      userProgress,
      dashboard,
      suggestions,
    });
  } catch (error) {
    logger.warn('Failed to preload Learn screen data (non-critical)', error);
  }
}

export function getCachedLearnScreenData(): LearnScreenCacheData | null {
  return cache.get('learn-screen');
}

export function getCachedModules(): LearnScreenCacheData['modules'] | null {
  const cached = getCachedLearnScreenData();
  return cached ? cached.modules : null;
}

export function clearLearnScreenCache(): void {
  cache.clear();
}
