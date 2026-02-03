import { getDashboard } from './profile';
import { getDueReviewsLatest } from './progress';
import { createLogger } from '@/services/logging';
import { CacheManager } from '@/services/cache/cache-utils';
import type { DashboardData } from './profile';
import type { DueReviewLatest } from './progress';

const logger = createLogger('ReviewScreenCache');

export interface ReviewScreenCacheData {
  dashboard: DashboardData | null;
  due: DueReviewLatest[];
}

const cache = new CacheManager<ReviewScreenCacheData>(5 * 60 * 1000);

export async function preloadReviewScreenData(): Promise<ReviewScreenCacheData | null> {
  try {
    const [dashboardRes, dueItems] = await Promise.all([
      getDashboard().catch(() => null),
      getDueReviewsLatest().catch(() => []),
    ]);
    const data: ReviewScreenCacheData = {
      dashboard: dashboardRes ?? null,
      due: dueItems ?? [],
    };
    cache.set('review-screen', data);
    return data;
  } catch (error) {
    logger.warn('Failed to preload Review screen data (non-critical)', error);
    return null;
  }
}

export function getCachedReviewScreenData(): ReviewScreenCacheData | null {
  return cache.get('review-screen');
}

export function clearReviewScreenCache(): void {
  cache.clear();
}
