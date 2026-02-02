import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveOnboardingDto, OnboardingResponseDto } from './dto/onboarding.dto';
import { DELIVERY_METHOD } from '@prisma/client';
import { OnboardingPreferencesService } from './onboarding-preferences.service';
import { LoggerService } from '../common/logger';

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
  private readonly logger = new LoggerService(OnboardingService.name);

  constructor(
    private prisma: PrismaService,
    private preferencesService: OnboardingPreferencesService,
  ) {}

  async saveOnboarding(
    userId: string,
    dto: SaveOnboardingDto,
  ): Promise<OnboardingResponseDto> {
    const rawAnswers = dto.answers as OnboardingAnswers;
    const submission = buildOnboardingSubmission(rawAnswers);

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

    await this.initializeDeliveryMethodScores(userId);

    return {
      userId: onboarding.userId,
      answers: onboarding.answers as Record<string, any>,
      createdAt: onboarding.createdAt,
      updatedAt: onboarding.updatedAt,
    };
  }

  private async initializeDeliveryMethodScores(userId: string): Promise<void> {
    try {
      const initialScores =
        await this.preferencesService.getInitialDeliveryMethodScores(userId);

      const existingScores = await this.prisma.userDeliveryMethodScore.findMany({
        where: { userId },
        select: { deliveryMethod: true },
      });

      const existingMethods = new Set(
        existingScores.map((s) => s.deliveryMethod),
      );

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
      this.logger.logError(
        'Failed to initialize delivery method scores',
        error,
        { userId },
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
