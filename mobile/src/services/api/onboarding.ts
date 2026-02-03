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

export async function saveOnboarding(
  userId: string,
  answers: OnboardingAnswers,
): Promise<OnboardingResponse> {
  return apiClient.post<OnboardingResponse>('/onboarding', {
    answers,
  });
}

export async function getOnboarding(): Promise<OnboardingResponse | null> {
  return apiClient.get<OnboardingResponse | null>('/onboarding');
}

export async function hasOnboarding(_userId?: string): Promise<boolean> {
  const response = await apiClient.get<HasOnboardingResponse>('/onboarding/has');
  return response.hasOnboarding;
}
