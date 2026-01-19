import { apiClient } from './client';

export interface LearnNextResponse {
  type: 'review' | 'new' | 'done';
  lessonId: string;
  teachingId?: string;
  question?: {
    id: string;
    teachingId: string;
    deliveryMethods: string[];
  };
  suggestedDeliveryMethod?: string;
  rationale?: string;
}

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

/**
 * Get next item in lesson (reviews → new → done)
 */
export async function getNext(lessonId: string): Promise<LearnNextResponse> {
  return apiClient.get<LearnNextResponse>(`/learn/next?lessonId=${lessonId}`);
}

/**
 * Get lesson/module suggestions
 */
export async function getSuggestions(options?: {
  currentLessonId?: string;
  moduleId?: string;
  limit?: number;
}): Promise<LearnSuggestionsResponse> {
  const params = new URLSearchParams();
  if (options?.currentLessonId) params.append('currentLessonId', options.currentLessonId);
  if (options?.moduleId) params.append('moduleId', options.moduleId);
  if (options?.limit) params.append('limit', options.limit.toString());
  
  const query = params.toString();
  return apiClient.get<LearnSuggestionsResponse>(`/learn/suggestions${query ? `?${query}` : ''}`);
}

/**
 * Get complete session plan
 */
export async function getSessionPlan(options?: {
  mode?: 'learn' | 'review' | 'mixed';
  timeBudgetSec?: number;
  lessonId?: string;
  moduleId?: string;
  theme?: string;
}): Promise<any> {
  const params = new URLSearchParams();
  if (options?.mode) params.append('mode', options.mode);
  if (options?.timeBudgetSec) params.append('timeBudgetSec', options.timeBudgetSec.toString());
  if (options?.lessonId) params.append('lessonId', options.lessonId);
  if (options?.moduleId) params.append('moduleId', options.moduleId);
  if (options?.theme) params.append('theme', options.theme);
  
  const query = params.toString();
  return apiClient.get(`/learn/session-plan${query ? `?${query}` : ''}`);
}
