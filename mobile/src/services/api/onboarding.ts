import { apiClient } from './client';
import type { OnboardingAnswers } from '@/types/onboarding';

export interface OnboardingResponse {
  userId: string;
  answers: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface HasOnboardingResponse {
  hasOnboarding: boolean;
}

/**
 * Save onboarding answers
 * Backend now accepts raw OnboardingAnswers and processes them server-side
 */
export async function saveOnboarding(
  userId: string,
  answers: OnboardingAnswers,
): Promise<OnboardingResponse> {
  // Backend now accepts raw answers and processes them
  return apiClient.post<OnboardingResponse>('/onboarding', {
    answers,
  });
}

/**
 * Get onboarding answers
 */
export async function getOnboarding(): Promise<OnboardingResponse | null> {
  return apiClient.get<OnboardingResponse | null>('/onboarding');
}

/**
 * Check if user has completed onboarding
 * @param userId - Optional, not used (backend gets userId from JWT)
 */
export async function hasOnboarding(userId?: string): Promise<boolean> {
  // Backend endpoint doesn't need userId (uses JWT), but we accept it for compatibility
  const response = await apiClient.get<HasOnboardingResponse>('/onboarding/has');
  return response.hasOnboarding;
}
