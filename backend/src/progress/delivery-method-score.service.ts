import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryMethodScoreDto } from './dto/delivery-method-score.dto';
import { DELIVERY_METHOD } from '@prisma/client';
import { LoggerService } from '../common/logger';

/**
 * DeliveryMethodScoreService
 * 
 * Manages user delivery method performance scores.
 * Follows Single Responsibility Principle - focused only on delivery method scoring.
 */
@Injectable()
export class DeliveryMethodScoreService {
  private readonly logger = new LoggerService(DeliveryMethodScoreService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Update user's score for a specific delivery method.
   * Creates row if it doesn't exist (upsert).
   */
  async updateDeliveryMethodScore(
    userId: string,
    method: DELIVERY_METHOD,
    dto: DeliveryMethodScoreDto,
  ) {
    const { delta } = dto;

    // Get current score (default 50 = neutral)
    const existing = await this.prisma.userDeliveryMethodScore.findUnique({
      where: {
        userId_deliveryMethod: {
          userId,
          deliveryMethod: method,
        },
      },
    });

    const currentScore = existing?.score ?? 50;
    const newScore = Math.max(0, Math.min(100, currentScore + delta));

    this.logger.debug(
      `Updating delivery method score: ${method} for user ${userId}`,
      {
        currentScore,
        delta,
        newScore,
      },
    );

    return this.prisma.userDeliveryMethodScore.upsert({
      where: {
        userId_deliveryMethod: {
          userId,
          deliveryMethod: method,
        },
      },
      update: {
        score: newScore,
        updatedAt: new Date(),
      },
      create: {
        userId,
        deliveryMethod: method,
        score: newScore,
      },
    });
  }
}
