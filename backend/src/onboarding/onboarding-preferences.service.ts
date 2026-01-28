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

  /**
   * Get normalized onboarding preferences for a user.
   * All users must have onboarding data.
   */
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

  /**
   * Get initial delivery method scores based on learning styles and experience.
   * Returns a map of delivery method to initial score (0-1).
   */
  async getInitialDeliveryMethodScores(
    userId: string,
  ): Promise<Map<DELIVERY_METHOD, number>> {
    const preferences = await this.getOnboardingPreferences(userId);
    const scores = new Map<DELIVERY_METHOD, number>();

    // Default neutral score for all methods
    const defaultScore = 0.5;
    for (const method of Object.values(DELIVERY_METHOD)) {
      scores.set(method, defaultScore);
    }

    const { learningStyles, experience } = preferences;

    // Learning style to delivery method mapping
    const learningStyleMap: Record<string, DELIVERY_METHOD[]> = {
      visual: [DELIVERY_METHOD.FLASHCARD, DELIVERY_METHOD.MULTIPLE_CHOICE],
      auditory: [DELIVERY_METHOD.TEXT_TO_SPEECH, DELIVERY_METHOD.SPEECH_TO_TEXT],
      kinesthetic: [DELIVERY_METHOD.FILL_BLANK, DELIVERY_METHOD.TEXT_TRANSLATION],
      reading: [DELIVERY_METHOD.TEXT_TRANSLATION, DELIVERY_METHOD.FILL_BLANK],
      writing: [DELIVERY_METHOD.FILL_BLANK, DELIVERY_METHOD.TEXT_TRANSLATION],
    };

    // Apply learning style preferences
    if (learningStyles && learningStyles.length > 0) {
      for (const style of learningStyles) {
        const styleLower = style.toLowerCase();
        const preferredMethods = learningStyleMap[styleLower] || [];

        // Boost scores for preferred methods (0.6-0.7 range)
        for (const method of preferredMethods) {
          const currentScore = scores.get(method) || defaultScore;
          scores.set(method, Math.max(currentScore, 0.65));
        }

        // Slightly reduce scores for non-preferred methods (0.4-0.5 range)
        // Only if user has specific learning style preferences
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

    // Experience level adjustment
    if (experience) {
      const experienceLower = experience.toLowerCase();
      let adjustment = 0;

      if (experienceLower.includes('beginner') || experienceLower.includes('new')) {
        adjustment = -0.1; // Slightly lower scores for beginners
      } else if (
        experienceLower.includes('advanced') ||
        experienceLower.includes('expert')
      ) {
        adjustment = +0.1; // Slightly higher scores for advanced users
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

  /**
   * Get BKT parameters adjusted for user's experience level.
   * Returns null if experience level doesn't require adjustment (uses defaults).
   */
  async getInitialBktParameters(userId: string): Promise<BktParameters | null> {
    const preferences = await this.getOnboardingPreferences(userId);

    if (!preferences.experience) {
      return null; // Use defaults if no experience specified
    }

    const experienceLower = preferences.experience.toLowerCase();

    // Beginner: Higher prior (assume less prior knowledge), lower learn rate
    if (experienceLower.includes('beginner') || experienceLower.includes('new')) {
      return {
        prior: 0.4, // 40% initial knowledge (higher uncertainty)
        learn: 0.15, // 15% learning rate (slower learning)
        guess: 0.2, // 20% guess rate (same as default)
        slip: 0.1, // 10% slip rate (same as default)
      };
    }

    // Advanced: Lower prior (assume more prior knowledge), higher learn rate
    if (experienceLower.includes('advanced') || experienceLower.includes('expert')) {
      return {
        prior: 0.2, // 20% initial knowledge (lower uncertainty)
        learn: 0.25, // 25% learning rate (faster learning)
        guess: 0.2, // 20% guess rate (same as default)
        slip: 0.1, // 10% slip rate (same as default)
      };
    }

    // Intermediate: Use defaults (return null to use defaults)
    return null;
  }

  /**
   * Get session defaults from onboarding preferences.
   */
  async getSessionDefaults(userId: string): Promise<SessionDefaults> {
    const preferences = await this.getOnboardingPreferences(userId);

    // Convert session minutes to seconds
    const timeBudgetSec = preferences.sessionMinutes
      ? preferences.sessionMinutes * 60
      : null;

    return {
      timeBudgetSec,
      mode: null, // Mode preference not captured in onboarding yet
    };
  }
}
