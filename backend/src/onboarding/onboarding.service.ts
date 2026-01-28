import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveOnboardingDto, OnboardingResponseDto } from './dto/onboarding.dto';
import { DELIVERY_METHOD } from '@prisma/client';
import { OnboardingPreferencesService } from './onboarding-preferences.service';

// Business logic constants (moved from frontend)
const DIFFICULTY_WEIGHTS: Record<string, number> = {
  easy: 0.25,
  balanced: 0.5,
  hard: 0.85,
};

const SESSION_MINUTES: Record<string, number> = {
  short: 8,
  focused: 22,
  deep: 45,
};

const FEEDBACK_DEPTH: Record<string, number> = {
  gentle: 0.3,
  direct: 0.6,
  detailed: 0.9,
};

const GAMIFICATION_WEIGHTS: Record<string, number> = {
  none: 0,
  light: 0.45,
  full: 0.9,
};

const ONBOARDING_SCHEMA_VERSION = 1;

interface OnboardingAnswers {
  motivation?: { key: string; otherText?: string | null } | null;
  learningStyles?: string[] | null;
  memoryHabit?: string | null;
  difficulty?: string | null;
  gamification?: string | null;
  feedback?: string | null;
  sessionStyle?: string | null;
  tone?: string | null;
  experience?: string | null;
}

interface OnboardingSubmission {
  version: number;
  raw: OnboardingAnswers;
  tags: string[];
  preferences: {
    goal: string | null;
    learningStyles: string[];
    memoryHabit: string | null;
    difficulty: string | null;
    gamification: string | null;
    feedback: string | null;
    sessionStyle: string | null;
    tone: string | null;
    experience: string | null;
  };
  signals: {
    challengeWeight: number;
    sessionMinutes: number | null;
    prefersGamification: number | null;
    feedbackDepth: number | null;
    learningStyleFocus: string[];
  };
  savedAt: string;
}

/**
 * Build onboarding submission from raw answers
 * This business logic was moved from frontend to backend
 */
function buildOnboardingSubmission(
  answers: OnboardingAnswers,
): OnboardingSubmission {
  const challengeWeight = DIFFICULTY_WEIGHTS[answers.difficulty ?? ''] ?? 0.5;
  const prefersGamification =
    GAMIFICATION_WEIGHTS[answers.gamification ?? ''] ?? null;
  const feedbackDepthScore = FEEDBACK_DEPTH[answers.feedback ?? ''] ?? null;
  const sessionMinutesScore = answers.sessionStyle
    ? (SESSION_MINUTES[answers.sessionStyle] ?? null)
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

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private preferencesService: OnboardingPreferencesService,
  ) {}

  async saveOnboarding(
    userId: string,
    dto: SaveOnboardingDto,
  ): Promise<OnboardingResponseDto> {
    // Accept raw OnboardingAnswers and process them server-side
    const rawAnswers = dto.answers as OnboardingAnswers;

    // Build complete submission with computed fields
    const submission = buildOnboardingSubmission(rawAnswers);

    // Store processed submission in database
    const onboarding = await this.prisma.onboardingAnswer.upsert({
      where: { userId },
      update: {
        answers: submission as any,
        updatedAt: new Date(),
      },
      create: {
        userId,
        answers: submission as any,
      },
    });

    // Initialize delivery method scores from onboarding preferences
    // Only initialize if user doesn't have existing scores (to preserve performance data)
    await this.initializeDeliveryMethodScores(userId);

    return {
      userId: onboarding.userId,
      answers: onboarding.answers as Record<string, any>,
      createdAt: onboarding.createdAt,
      updatedAt: onboarding.updatedAt,
    };
  }

  /**
   * Initialize delivery method scores from onboarding preferences.
   * Only creates scores for methods that don't already exist (preserves performance data).
   */
  private async initializeDeliveryMethodScores(userId: string): Promise<void> {
    try {
      const initialScores =
        await this.preferencesService.getInitialDeliveryMethodScores(userId);

      // Get existing scores to avoid overwriting performance data
      const existingScores = await this.prisma.userDeliveryMethodScore.findMany({
        where: { userId },
        select: { deliveryMethod: true },
      });

      const existingMethods = new Set(
        existingScores.map((s) => s.deliveryMethod),
      );

      // Create scores only for methods that don't exist yet
      const scoresToCreate = Array.from(initialScores.entries())
        .filter(([method]) => !existingMethods.has(method))
        .map(([deliveryMethod, score]) => ({
          userId,
          deliveryMethod,
          score,
        }));

      if (scoresToCreate.length > 0) {
        await this.prisma.userDeliveryMethodScore.createMany({
          data: scoresToCreate,
          skipDuplicates: true,
        });
      }
    } catch (error) {
      // Log error but don't fail onboarding save
      console.error(
        `Failed to initialize delivery method scores for user ${userId}:`,
        error,
      );
    }
  }

  async getOnboarding(userId: string): Promise<OnboardingResponseDto | null> {
    const onboarding = await this.prisma.onboardingAnswer.findUnique({
      where: { userId },
    });

    if (!onboarding) {
      return null;
    }

    return {
      userId: onboarding.userId,
      answers: onboarding.answers as Record<string, any>,
      createdAt: onboarding.createdAt,
      updatedAt: onboarding.updatedAt,
    };
  }

  async hasOnboarding(userId: string): Promise<boolean> {
    const onboarding = await this.prisma.onboardingAnswer.findUnique({
      where: { userId },
      select: { userId: true },
    });

    return !!onboarding;
  }
}
