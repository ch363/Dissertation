import { getSessionPlan } from './learn';
import { transformSessionPlan } from './session-plan-transformer';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { SessionPlan } from '@/types/session';

/**
 * Simple cache for preloaded session plans
 * Key: lessonId, Value: { plan, timestamp }
 */
const cache = new Map<
  string,
  {
    plan: SessionPlan;
    timestamp: number;
  }
>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Preload a session plan for a lesson
 * This can be called when user presses down on a lesson card
 */
export async function preloadSessionPlan(lessonId: string): Promise<void> {
  // Skip if already cached and fresh
  const cached = cache.get(lessonId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return;
  }

  try {
    const sessionId = makeSessionId('learn');
    const response = await getSessionPlan({
      mode: 'learn',
      lessonId,
    });

    const planData = response?.data || response;
    if (planData && planData.steps && Array.isArray(planData.steps) && planData.steps.length > 0) {
      const transformedPlan = transformSessionPlan(planData, sessionId);
      if (transformedPlan.cards.length > 0) {
        cache.set(lessonId, {
          plan: transformedPlan,
          timestamp: Date.now(),
        });
      }
    }
  } catch (error) {
    console.error('Failed to preload session plan:', error);
    // Don't throw - preloading is best effort
  }
}

/**
 * Get a cached session plan
 */
export function getCachedSessionPlan(lessonId: string): SessionPlan | null {
  const cached = cache.get(lessonId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.plan;
  }
  // Remove stale cache
  if (cached) {
    cache.delete(lessonId);
  }
  return null;
}

/**
 * Clear the cache (useful for testing or memory management)
 */
export function clearSessionPlanCache(): void {
  cache.clear();
}

/**
 * Clear a specific lesson from cache
 */
export function clearCachedSessionPlan(lessonId: string): void {
  cache.delete(lessonId);
}
