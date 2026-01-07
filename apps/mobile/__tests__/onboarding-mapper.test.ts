import { onboardingAnswersSchema } from '@/features/onboarding/types/schema';
import {
  buildOnboardingSubmission,
  normalizeOnboardingAnswers,
} from '@/features/onboarding/utils/mapper';

describe('onboarding mapper', () => {
  const baseAnswers = onboardingAnswersSchema.parse({
    motivation: { key: 'travel' },
    learningStyles: ['visual'],
    difficulty: 'balanced',
    gamification: 'light',
    feedback: 'gentle',
    sessionStyle: 'focused',
  });

  it('normalizes answers', () => {
    const normalized = normalizeOnboardingAnswers(baseAnswers);
    expect(normalized.learningStyles).toContain('visual');
  });

  it('builds submission with tags and signals', () => {
    const submission = buildOnboardingSubmission(baseAnswers);
    expect(submission.version).toBeGreaterThan(0);
    expect(submission.tags).toContain('goal:travel');
    expect(submission.signals.challengeWeight).toBeDefined();
  });
});
