import { Injectable } from '@nestjs/common';
import { UserTeachingCompleted, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaRepository, IReadRepository } from '../../common/repositories';

/**
 * IUserTeachingViewRepository
 *
 * Read-only repository interface for user teaching views.
 * Uses UserTeachingCompleted model to track which teachings users have seen/completed.
 */
export interface IUserTeachingViewRepository
  extends IReadRepository<UserTeachingCompleted> {
  /**
   * Find all teaching views for a user.
   */
  findManyByUserId(userId: string): Promise<UserTeachingCompleted[]>;

  /**
   * Get set of teaching IDs the user has seen.
   */
  getSeenTeachingIdsByUserId(userId: string): Promise<Set<string>>;
}

/**
 * UserTeachingViewRepository
 *
 * Data access layer for user teaching views.
 * Uses UserTeachingCompleted model as the underlying storage.
 * Implements IUserTeachingViewRepository for DIP compliance.
 */
@Injectable()
export class UserTeachingViewRepository
  extends PrismaRepository<
    UserTeachingCompleted,
    Prisma.UserTeachingCompletedCreateInput,
    Prisma.UserTeachingCompletedUpdateInput
  >
  implements IUserTeachingViewRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'userTeachingCompleted');
  }

  async findManyByUserId(userId: string): Promise<UserTeachingCompleted[]> {
    return this.getModel().findMany({
      where: { userId },
    });
  }

  async getSeenTeachingIdsByUserId(userId: string): Promise<Set<string>> {
    const views = await this.getModel().findMany({
      where: { userId },
      select: { teachingId: true },
    });
    return new Set(views.map((v) => v.teachingId));
  }
}
