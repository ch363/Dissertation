import { Injectable } from '@nestjs/common';
import { UserDeliveryMethodScore, Prisma, DELIVERY_METHOD } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaRepository, IReadRepository } from '../../common/repositories';

/**
 * IUserDeliveryMethodScoreRepository
 *
 * Read-only repository interface for user delivery method scores.
 * Used by engine services for delivery method preference analysis.
 */
export interface IUserDeliveryMethodScoreRepository
  extends IReadRepository<UserDeliveryMethodScore> {
  /**
   * Find all delivery method scores for a user.
   */
  findManyByUserId(userId: string): Promise<UserDeliveryMethodScore[]>;

  /**
   * Get scores as a map for easy lookup.
   */
  getScoreMapByUserId(userId: string): Promise<Map<DELIVERY_METHOD, number>>;

  /**
   * Delete all delivery method scores for a user.
   */
  deleteAllByUserId(userId: string): Promise<number>;
}

/**
 * UserDeliveryMethodScoreRepository
 *
 * Data access layer for user delivery method scores.
 * Implements IUserDeliveryMethodScoreRepository for DIP compliance.
 */
@Injectable()
export class UserDeliveryMethodScoreRepository
  extends PrismaRepository<
    UserDeliveryMethodScore,
    Prisma.UserDeliveryMethodScoreCreateInput,
    Prisma.UserDeliveryMethodScoreUpdateInput
  >
  implements IUserDeliveryMethodScoreRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'userDeliveryMethodScore');
  }

  async findManyByUserId(userId: string): Promise<UserDeliveryMethodScore[]> {
    return this.getModel().findMany({
      where: { userId },
    });
  }

  async getScoreMapByUserId(userId: string): Promise<Map<DELIVERY_METHOD, number>> {
    const scores = await this.findManyByUserId(userId);
    const scoreMap = new Map<DELIVERY_METHOD, number>();
    for (const score of scores) {
      scoreMap.set(score.deliveryMethod, score.score);
    }
    return scoreMap;
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const result = await this.getModel().deleteMany({
      where: { userId },
    });
    return result.count;
  }
}
