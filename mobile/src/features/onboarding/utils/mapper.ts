import { onboardingAnswersSchema, type OnboardingAnswers } from '@/types/onboarding';

export function normalizeOnboardingAnswers(raw: unknown): OnboardingAnswers {
  return onboardingAnswersSchema.parse(raw);
}
