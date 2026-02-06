import { CacheManager } from './cache-utils';
import { createLogger, Logger } from '@/services/logging';
import { DEFAULT_CACHE_TTL_MS } from '@/services/api/defaults';

/**
 * ScreenCacheService
 *
 * Generic screen cache service that eliminates duplication across screen caches.
 * Follows DRY principle by centralizing preload pattern, error handling, and logging.
 *
 * @template T - The type of data being cached
 */
export class ScreenCacheService<T> {
  private cache: CacheManager<T>;
  private logger: Logger;
  private cacheKey: string;

  constructor(
    cacheKey: string,
    loggerName: string,
    ttl: number = DEFAULT_CACHE_TTL_MS,
  ) {
    this.cacheKey = cacheKey;
    this.cache = new CacheManager<T>(ttl);
    this.logger = createLogger(loggerName);
  }

  /**
   * Preload screen data with error handling and logging.
   *
   * @param fetchFn - Function that fetches and returns the data to cache
   */
  async preload(fetchFn: () => Promise<T>): Promise<void> {
    try {
      const data = await fetchFn();
      this.cache.set(this.cacheKey, data);
    } catch (error) {
      this.logger.warn(
        `Failed to preload ${this.cacheKey} data (non-critical)`,
        error,
      );
    }
  }

  /**
   * Get cached data for the screen.
   */
  getCached(): T | null {
    return this.cache.get(this.cacheKey);
  }

  /**
   * Clear the screen cache.
   */
  clear(): void {
    this.cache.clear(this.cacheKey);
  }

  /**
   * Clear all caches.
   */
  clearAll(): void {
    this.cache.clear();
  }
}

/**
 * Helper function to create safe API calls with fallback values.
 * Reduces duplication of `.catch(() => defaultValue)` pattern.
 *
 * @param apiCall - The API call to make
 * @param fallback - The fallback value if the call fails
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await apiCall();
  } catch {
    return fallback;
  }
}

/**
 * Helper function to make multiple safe API calls in parallel.
 *
 * @param calls - Array of [apiCall, fallback] tuples
 */
export async function parallelSafeApiCalls<T extends any[]>(
  ...calls: { [K in keyof T]: [() => Promise<T[K]>, T[K]] }
): Promise<T> {
  const results = await Promise.all(
    calls.map(([apiCall, fallback]) => safeApiCall(apiCall, fallback)),
  );
  return results as T;
}
