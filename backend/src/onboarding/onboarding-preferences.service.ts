import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DELIVERY_METHOD } from '@prisma/client';
import { BktParameters } from '../engine/mastery/mastery.service';

export interface OnboardingPreferences {
  challengeWeight: number;
  sessionMinutes: number | null;
  prefersGamification: number | null;
  feedbackDepth: number | null;
  learningStyles: string[];
  experience: string | null;
  memoryHabit: string | null;
}

export interface SessionDefaults {
  timeBudgetSec: number | null;
  mode: 'learn' | 'review' | 'mixed' | null;
}

@Injectable()
export class OnboardingPreferencesService {
  constructor(private prisma: PrismaService) {}

  async getOnboardingPreferences(
    userId: string,
  ): Promise<OnboardingPreferences> {
    const onboarding = await this.prisma.onboardingAnswer.findUnique({
      where: { userId },
    });

    if (!onboarding) {
      throw new Error(
        `User ${userId} does not have onboarding data. All users must complete onboarding.`,
      );
    }

    const answers = onboarding.answers as any;
    const signals = answers?.signals || {};

    return {
      challengeWeight: signals.challengeWeight ?? 0.5,
      sessionMinutes: signals.sessionMinutes ?? null,
      prefersGamification: signals.prefersGamification ?? null,
      feedbackDepth: signals.feedbackDepth ?? null,
      learningStyles: signals.learningStyleFocus || [],
      experience: answers?.preferences?.experience || null,
      memoryHabit: answers?.preferences?.memoryHabit || null,
    };
  }

  async getInitialDeliveryMethodScores(
    userId: string,
  ): Promise<Map<DELIVERY_METHOD, number>> {
    const preferences = await this.getOnboardingPreferences(userId);
    const scores = new Map<DELIVERY_METHOD, number>();

    const defaultScore = 0.5;
    for (const method of Object.values(DELIVERY_METHOD)) {
      scores.set(method, defaultScore);
    }

    const { learningStyles, experience } = preferences;

    const learningStyleMap: Record<string, DELIVERY_METHOD[]> = {
      visual: [DELIVERY_METHOD.FLASHCARD, DELIVERY_METHOD.MULTIPLE_CHOICE],
      auditory: [DELIVERY_METHOD.TEXT_TO_SPEECH, DELIVERY_METHOD.SPEECH_TO_TEXT],
      kinesthetic: [DELIVERY_METHOD.FILL_BLANK, DELIVERY_METHOD.TEXT_TRANSLATION],
      reading: [DELIVERY_METHOD.TEXT_TRANSLATION, DELIVERY_METHOD.FILL_BLANK],
      writing: [DELIVERY_METHOD.FILL_BLANK, DELIVERY_METHOD.TEXT_TRANSLATION],
    };

    if (learningStyles && learningStyles.length > 0) {
      for (const style of learningStyles) {
        const styleLower = style.toLowerCase();
        const preferredMethods = learningStyleMap[styleLower] || [];

        for (const method of preferredMethods) {
          const currentScore = scores.get(method) || defaultScore;
          scores.set(method, Math.max(currentScore, 0.65));
        }

        if (preferredMethods.length > 0) {
          for (const method of Object.values(DELIVERY_METHOD)) {
            if (!preferredMethods.includes(method)) {
              const currentScore = scores.get(method) || defaultScore;
              scores.set(method, Math.min(currentScore, 0.45));
            }
          }
        }
      }
    }

    if (experience) {
      const experienceLower = experience.toLowerCase();
      let adjustment = 0;

      if (experienceLower.includes('beginner') || experienceLower.includes('new')) {
        adjustment = -0.1;
      } else if (
        experienceLower.includes('advanced') ||
        experienceLower.includes('expert')
      ) {
        adjustment = +0.1;
      }

      if (adjustment !== 0) {
        for (const method of Object.values(DELIVERY_METHOD)) {
          const currentScore = scores.get(method) || defaultScore;
          scores.set(method, Math.max(0.1, Math.min(1.0, currentScore + adjustment)));
        }
      }
    }

    return scores;
  }

  async getInitialBktParameters(userId: string): Promise<BktParameters | null> {
    const preferences = await this.getOnboardingPreferences(userId);

    if (!preferences.experience) {
      return null;
    }

    const experienceLower = preferences.experience.toLowerCase();

    if (experienceLower.includes('beginner') || experienceLower.includes('new')) {
      return {
        prior: 0.4,
        learn: 0.15,
        guess: 0.2,
        slip: 0.1,
      };
    }

    if (experienceLower.includes('advanced') || experienceLower.includes('expert')) {
      return {
        prior: 0.2,
        learn: 0.25,
        guess: 0.2,
        slip: 0.1,
      };
    }

    return null;
  }

  async getSessionDefaults(userId: string): Promise<SessionDefaults> {
    const preferences = await this.getOnboardingPreferences(userId);

    const timeBudgetSec = preferences.sessionMinutes
      ? preferences.sessionMinutes * 60
      : null;

    return {
      timeBudgetSec,
      mode: null,
    };
  }
}
