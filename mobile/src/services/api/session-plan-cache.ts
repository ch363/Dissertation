import { getSessionPlan } from './learn';
import { transformSessionPlan } from './session-plan-transformer';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { SessionPlan } from '@/types/session';
import {
  getSessionDefaultMode,
  getSessionDefaultTimeBudgetSec,
} from '@/services/preferences/settings-facade';

/**
 * Simple cache for preloaded session plans
 * Key: lessonId|mode|timeBudgetSec, Value: { plan, timestamp }
 */
const cache = new Map<
  string,
  {
    plan: SessionPlan;
    timestamp: number;
  }
>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export type SessionPlanCacheContext = {
  lessonId: string;
  mode: 'learn' | 'review' | 'mixed';
  timeBudgetSec?: number | null;
};

function makeCacheKey(ctx: SessionPlanCacheContext) {
  const budget = ctx.timeBudgetSec ?? '';
  return `${ctx.lessonId}|${ctx.mode}|${budget}`;
}

/**
 * Preload a session plan for a lesson
 * This can be called when user presses down on a lesson card
 */
export async function preloadSessionPlan(lessonId: string): Promise<void> {
  const [mode, timeBudgetSec] = await Promise.all([
    getSessionDefaultMode(),
    getSessionDefaultTimeBudgetSec(),
  ]);

  const key = makeCacheKey({ lessonId, mode, timeBudgetSec });

  // Skip if already cached and fresh for this context
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return;
  }

  try {
    const sessionId = makeSessionId(mode === 'review' ? 'review' : 'learn');
    const response = await getSessionPlan({
      mode,
      lessonId,
      timeBudgetSec: timeBudgetSec ?? undefined,
    });

    const planData = response?.data || response;
    if (planData && planData.steps && Array.isArray(planData.steps) && planData.steps.length > 0) {
      const transformedPlan = transformSessionPlan(planData, sessionId);
      if (transformedPlan.cards.length > 0) {
        cache.set(key, {
          plan: transformedPlan,
          timestamp: Date.now(),
        });
      }
    }
  } catch (error: any) {
    const msg = error?.message ?? String(error);
    const isTimeout = typeof msg === 'string' && msg.toLowerCase().includes('timeout');
    console.warn(
      isTimeout
        ? `Preload session plan timed out (best-effort, will load on demand).`
        : `Preload session plan failed (best-effort): ${msg}`,
    );
    // Don't throw - preloading is best effort
  }
}

/**
 * Get a cached session plan
 */
export function getCachedSessionPlan(ctx: SessionPlanCacheContext): SessionPlan | null {
  const key = makeCacheKey(ctx);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.plan;
  }
  // Remove stale cache
  if (cached) {
    cache.delete(key);
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
  const prefix = `${lessonId}|`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
