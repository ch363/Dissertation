import { getDashboard } from './profile';
import { getSuggestions } from './learn';
import { getLessons, getModules } from './modules';
import { getUserLessons } from './progress';

export interface LearnScreenCacheData {
  modules: Awaited<ReturnType<typeof getModules>>;
  lessons: Awaited<ReturnType<typeof getLessons>>;
  userProgress: Awaited<ReturnType<typeof getUserLessons>>;
  dashboard: Awaited<ReturnType<typeof getDashboard>>;
  suggestions: Awaited<ReturnType<typeof getSuggestions>>;
  timestamp: number;
}

/**
 * Simple cache for preloaded Learn screen data
 * Key: 'learn-screen', Value: { data, timestamp }
 */
const cache = new Map<string, LearnScreenCacheData>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if cached data is still valid
 */
function isCacheValid(cached: LearnScreenCacheData | undefined): boolean {
  if (!cached) return false;
  const age = Date.now() - cached.timestamp;
  return age < CACHE_TTL;
}

/**
 * Preload Learn screen data in the background
 * This should be called after user authentication
 */
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
      timestamp: Date.now(),
    });

    console.log('Learn screen data preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload Learn screen data (non-critical):', error);
    // Silently fail - preloading is best effort
  }
}

/**
 * Get cached Learn screen data if available and valid
 */
export function getCachedLearnScreenData(): LearnScreenCacheData | null {
  const cached = cache.get('learn-screen');
  if (isCacheValid(cached)) {
    return cached;
  }
  return null;
}

/**
 * Clear the Learn screen cache
 */
export function clearLearnScreenCache(): void {
  cache.clear();
}
