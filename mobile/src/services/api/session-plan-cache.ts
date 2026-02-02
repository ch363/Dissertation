import { getSessionPlan } from './learn';
import { transformSessionPlan } from './session-plan-transformer';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { SessionPlan } from '@/types/session';
import {
  getSessionDefaultMode,
  getSessionDefaultTimeBudgetSec,
} from '@/services/preferences/settings-facade';
import { createLogger } from '@/services/logging';
import { CacheManager } from '@/services/cache/cache-utils';

const logger = createLogger('SessionPlanCache');

const cache = new CacheManager<SessionPlan>(5 * 60 * 1000);

export type SessionPlanCacheContext = {
  lessonId: string;
  mode: 'learn' | 'review' | 'mixed';
  timeBudgetSec?: number | null;
};

function makeCacheKey(ctx: SessionPlanCacheContext) {
  const budget = ctx.timeBudgetSec ?? '';
  return `${ctx.lessonId}|${ctx.mode}|${budget}`;
}

export async function preloadSessionPlan(lessonId: string): Promise<void> {
  const [mode, timeBudgetSec] = await Promise.all([
    getSessionDefaultMode(),
    getSessionDefaultTimeBudgetSec(),
  ]);

  const key = makeCacheKey({ lessonId, mode, timeBudgetSec });

  if (cache.has(key)) {
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
        cache.set(key, transformedPlan);
      }
    }
  } catch (error: any) {
    const msg = error?.message ?? String(error);
    const isTimeout = typeof msg === 'string' && msg.toLowerCase().includes('timeout');
      logger.warn(
      isTimeout
        ? `Preload session plan timed out (best-effort, will load on demand).`
        : `Preload session plan failed (best-effort): ${msg}`,
      error,
    );
  }
}

export function getCachedSessionPlan(ctx: SessionPlanCacheContext): SessionPlan | null {
  const key = makeCacheKey(ctx);
  return cache.get(key);
}

export function clearSessionPlanCache(): void {
  cache.clear();
}

export function clearCachedSessionPlan(lessonId: string): void {
  const prefix = `${lessonId}|`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.clear(key);
    }
  }
}
