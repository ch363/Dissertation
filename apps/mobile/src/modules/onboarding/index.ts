import {
  buildOnboardingSubmission,
  normalizeOnboardingAnswers,
  ONBOARDING_SCHEMA_VERSION,
} from '../../lib/onboarding/mapper';
import type { OnboardingAnswers, OnboardingSubmission } from '../../lib/onboarding/schema';
import {
  getOnboarding as repoGetOnboarding,
  getOnboardingSubmission as repoGetOnboardingSubmission,
  hasOnboarding as repoHasOnboarding,
  saveOnboarding as repoSaveOnboarding,
} from '../../lib/onboardingRepo';

export async function hasOnboarding(userId: string) {
  return repoHasOnboarding(userId);
}

export async function saveOnboarding(userId: string, answers: OnboardingAnswers) {
  return repoSaveOnboarding(userId, answers);
}

export async function getOnboarding(userId: string) {
  return repoGetOnboarding(userId);
}

export async function getOnboardingSubmission(userId: string) {
  return repoGetOnboardingSubmission(userId);
}

export {
  buildOnboardingSubmission,
  normalizeOnboardingAnswers,
  ONBOARDING_SCHEMA_VERSION,
  type OnboardingAnswers,
  type OnboardingSubmission,
};
