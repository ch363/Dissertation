import { Injectable } from '@nestjs/common';
import { UserSkillMastery, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaRepository, IRepository } from '../../common/repositories';

/**
 * IUserSkillMasteryRepository
 *
 * Repository interface for user skill mastery data.
 * Used by MasteryService for BKT-based skill tracking.
 */
export interface IUserSkillMasteryRepository
  extends IRepository<
    UserSkillMastery,
    Prisma.UserSkillMasteryCreateInput,
    Prisma.UserSkillMasteryUpdateInput
  > {
  /**
   * Find mastery record by user and skill tag.
   */
  findByUserAndSkillTag(
    userId: string,
    skillTag: string,
  ): Promise<UserSkillMastery | null>;

  /**
   * Find skills below a mastery threshold.
   */
  findLowMasterySkills(
    userId: string,
    threshold: number,
  ): Promise<string[]>;

  /**
   * Find mastery records for multiple skill tags.
   */
  findManyByUserAndSkillTags(
    userId: string,
    skillTags: string[],
  ): Promise<UserSkillMastery[]>;

  /**
   * Upsert a mastery record.
   */
  upsertMastery(
    userId: string,
    skillTag: string,
    data: {
      masteryProbability: number;
      prior: number;
      learn: number;
      guess: number;
      slip: number;
    },
  ): Promise<UserSkillMastery>;

  /**
   * Update mastery probability for a user's skill.
   */
  updateMasteryProbability(
    userId: string,
    skillTag: string,
    masteryProbability: number,
  ): Promise<UserSkillMastery>;

  /**
   * Find all mastery records for a user ordered by last updated.
   */
  findManyByUserOrdered(userId: string): Promise<UserSkillMastery[]>;
}

/**
 * UserSkillMasteryRepository
 *
 * Data access layer for user skill mastery data.
 * Implements IUserSkillMasteryRepository for DIP compliance.
 */
@Injectable()
export class UserSkillMasteryRepository
  extends PrismaRepository<
    UserSkillMastery,
    Prisma.UserSkillMasteryCreateInput,
    Prisma.UserSkillMasteryUpdateInput
  >
  implements IUserSkillMasteryRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'userSkillMastery');
  }

  async findByUserAndSkillTag(
    userId: string,
    skillTag: string,
  ): Promise<UserSkillMastery | null> {
    return this.getModel().findUnique({
      where: {
        userId_skillTag: {
          userId,
          skillTag,
        },
      },
    });
  }

  async findLowMasterySkills(
    userId: string,
    threshold: number,
  ): Promise<string[]> {
    const records = await this.getModel().findMany({
      where: {
        userId,
        masteryProbability: {
          lt: threshold,
        },
      },
      select: {
        skillTag: true,
      },
    });
    return records.map((r) => r.skillTag);
  }

  async findManyByUserAndSkillTags(
    userId: string,
    skillTags: string[],
  ): Promise<UserSkillMastery[]> {
    return this.getModel().findMany({
      where: {
        userId,
        skillTag: {
          in: skillTags,
        },
      },
    });
  }

  async upsertMastery(
    userId: string,
    skillTag: string,
    data: {
      masteryProbability: number;
      prior: number;
      learn: number;
      guess: number;
      slip: number;
    },
  ): Promise<UserSkillMastery> {
    return this.getModel().upsert({
      where: {
        userId_skillTag: {
          userId,
          skillTag,
        },
      },
      create: {
        userId,
        skillTag,
        ...data,
      },
      update: {},
    });
  }

  async updateMasteryProbability(
    userId: string,
    skillTag: string,
    masteryProbability: number,
  ): Promise<UserSkillMastery> {
    return this.getModel().update({
      where: {
        userId_skillTag: {
          userId,
          skillTag,
        },
      },
      data: {
        masteryProbability,
      },
    });
  }

  async findManyByUserOrdered(userId: string): Promise<UserSkillMastery[]> {
    try {
      return await this.getModel().findMany({
        where: { userId },
        orderBy: { lastUpdated: 'desc' },
      });
    } catch (error) {
      this.logger.logError('Failed to find user skill masteries', error, {
        userId,
      });
      throw error;
    }
  }
}
