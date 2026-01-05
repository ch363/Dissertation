import { z } from 'zod';

export const ONBOARDING_SCHEMA_VERSION = 1;

export const onboardingAnswersSchema = z.object({
  motivation: z
    .object({
      key: z.string(),
      otherText: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  learningStyles: z.array(z.string()).max(3).optional().nullable(),
  memoryHabit: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  gamification: z.string().optional().nullable(),
  feedback: z.string().optional().nullable(),
  sessionStyle: z.string().optional().nullable(),
  tone: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
});

export type OnboardingAnswers = z.infer<typeof onboardingAnswersSchema>;

export const onboardingSubmissionSchema = z.object({
  version: z.number(),
  raw: onboardingAnswersSchema,
  tags: z.array(z.string()),
  preferences: z.object({
    goal: z.string().nullable().optional(),
    learningStyles: z.array(z.string()),
    memoryHabit: z.string().nullable().optional(),
    difficulty: z.string().nullable().optional(),
    gamification: z.string().nullable().optional(),
    feedback: z.string().nullable().optional(),
    sessionStyle: z.string().nullable().optional(),
    tone: z.string().nullable().optional(),
    experience: z.string().nullable().optional(),
  }),
  signals: z.object({
    challengeWeight: z.number(),
    sessionMinutes: z.number().nullable(),
    prefersGamification: z.number().nullable(),
    feedbackDepth: z.number().nullable(),
    learningStyleFocus: z.array(z.string()),
  }),
  savedAt: z.string(),
});

export type OnboardingSubmission = z.infer<typeof onboardingSubmissionSchema>;

export function parseOnboardingSubmission(value: unknown): OnboardingSubmission {
  return onboardingSubmissionSchema.parse(value);
}
