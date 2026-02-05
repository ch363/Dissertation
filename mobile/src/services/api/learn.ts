import { apiClient } from './client';
import { buildUrl } from './query-builder';

export interface LessonSuggestion {
  lesson: {
    id: string;
    title: string;
    imageUrl?: string | null;
  };
  module: {
    id: string;
    title: string;
  };
  reason: string;
}

export interface ModuleSuggestion {
  module: {
    id: string;
    title: string;
    imageUrl?: string | null;
  };
  reason: string;
}

export interface LearnSuggestionsResponse {
  lessons: LessonSuggestion[];
  modules: ModuleSuggestion[];
}

export interface SessionPlanResponse {
  id: string;
  kind: 'learn' | 'review' | 'mixed';
  lessonId?: string;
  title?: string;
  steps: {
    stepNumber: number;
    type: 'teach' | 'practice' | 'recap';
    item: Record<string, unknown>;
    estimatedTimeSec?: number;
    deliveryMethod?: string;
  }[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export async function getSuggestions(options?: {
  currentLessonId?: string;
  moduleId?: string;
  limit?: number;
}): Promise<LearnSuggestionsResponse> {
  const url = buildUrl('/learn/suggestions', {
    currentLessonId: options?.currentLessonId,
    moduleId: options?.moduleId,
    limit: options?.limit,
  });
  return apiClient.get<LearnSuggestionsResponse>(url);
}

export async function getSessionPlan(options?: {
  mode?: 'learn' | 'review' | 'mixed';
  timeBudgetSec?: number;
  lessonId?: string;
  moduleId?: string;
  theme?: string;
}): Promise<SessionPlanResponse> {
  const url = buildUrl('/learn/session-plan', {
    mode: options?.mode,
    timeBudgetSec: options?.timeBudgetSec,
    lessonId: options?.lessonId,
    moduleId: options?.moduleId,
    theme: options?.theme,
  });
  return apiClient.get(url);
}
