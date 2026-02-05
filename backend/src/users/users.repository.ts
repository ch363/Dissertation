import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaRepository } from '../common/repositories';

/**
 * UserRepository
 *
 * Data access layer for User entities.
 * Extends PrismaRepository to provide CRUD operations
 * and adds domain-specific query methods.
 */
@Injectable()
export class UserRepository extends PrismaRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  /**
   * Find user by auth ID (same as regular ID for this model).
   */
  async findByAuthId(authId: string): Promise<User | null> {
    return this.findById(authId);
  }

  /**
   * Create a new user with default values.
   */
  async createWithDefaults(authUid: string): Promise<User> {
    return this.create({
      id: authUid,
      knowledgePoints: 0,
      knowledgeLevel: 'A1',
    });
  }

  /**
   * Get user's knowledge level.
   */
  async getKnowledgeLevel(userId: string): Promise<string | null> {
    const user = await this.getModel().findUnique({
      where: { id: userId },
      select: { knowledgeLevel: true },
    });
    return user?.knowledgeLevel ?? null;
  }

  /**
   * Update user's knowledge points.
   */
  async updateKnowledgePoints(
    userId: string,
    points: number,
  ): Promise<User> {
    return this.update(userId, { knowledgePoints: points });
  }
}
