import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveOnboardingDto, OnboardingResponseDto } from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async saveOnboarding(userId: string, dto: SaveOnboardingDto): Promise<OnboardingResponseDto> {
    const onboarding = await this.prisma.onboardingAnswer.upsert({
      where: { userId },
      update: {
        answers: dto.answers,
        updatedAt: new Date(),
      },
      create: {
        userId,
        answers: dto.answers,
      },
    });

    return {
      userId: onboarding.userId,
      answers: onboarding.answers as Record<string, any>,
      createdAt: onboarding.createdAt,
      updatedAt: onboarding.updatedAt,
    };
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
