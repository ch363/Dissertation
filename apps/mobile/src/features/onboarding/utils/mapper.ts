import {
  onboardingAnswersSchema,
  ONBOARDING_SCHEMA_VERSION,
  type OnboardingAnswers,
  type OnboardingSubmission,
} from '@/features/onboarding/types/schema';

const difficultyWeights: Record<string, number> = {
  easy: 0.25,
  balanced: 0.5,
  hard: 0.85,
};

const sessionMinutes: Record<string, number> = {
  short: 8,
  focused: 22,
  deep: 45,
};

const feedbackDepth: Record<string, number> = {
  gentle: 0.3,
  direct: 0.6,
  detailed: 0.9,
};

const gamificationWeights: Record<string, number> = {
  none: 0,
  light: 0.45,
  full: 0.9,
};

export function normalizeOnboardingAnswers(raw: unknown): OnboardingAnswers {
  return onboardingAnswersSchema.parse(raw);
}

export function buildOnboardingSubmission(answers: OnboardingAnswers): OnboardingSubmission {
  const challengeWeight = difficultyWeights[answers.difficulty ?? ''] ?? 0.5;
  const prefersGamification = gamificationWeights[answers.gamification ?? ''] ?? null;
  const feedbackDepthScore = feedbackDepth[answers.feedback ?? ''] ?? null;
  const sessionMinutesScore = answers.sessionStyle
    ? (sessionMinutes[answers.sessionStyle] ?? null)
    : null;
  const learningStyleFocus = answers.learningStyles ?? [];

  const tags: string[] = [];
  if (answers.motivation?.key) tags.push(`goal:${answers.motivation.key}`);
  if (answers.experience) tags.push(`experience:${answers.experience}`);
  learningStyleFocus.forEach((style) => tags.push(`learning:${style}`));
  if (answers.gamification) tags.push(`gamification:${answers.gamification}`);

  return {
    version: ONBOARDING_SCHEMA_VERSION,
    raw: answers,
    tags,
    preferences: {
      goal: answers.motivation?.key ?? null,
      learningStyles: learningStyleFocus,
      memoryHabit: answers.memoryHabit ?? null,
      difficulty: answers.difficulty ?? null,
      gamification: answers.gamification ?? null,
      feedback: answers.feedback ?? null,
      sessionStyle: answers.sessionStyle ?? null,
      tone: answers.tone ?? null,
      experience: answers.experience ?? null,
    },
    signals: {
      challengeWeight,
      sessionMinutes: sessionMinutesScore,
      prefersGamification,
      feedbackDepth: feedbackDepthScore,
      learningStyleFocus,
    },
    savedAt: new Date().toISOString(),
  };
}

export { ONBOARDING_SCHEMA_VERSION };
