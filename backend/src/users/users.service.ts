import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Provision user - creates user if doesn't exist, otherwise returns existing
   * Called by me module for user provisioning
   */
  async upsertUser(authUid: string) {
    if (!authUid || typeof authUid !== 'string' || authUid.trim() === '') {
      throw new Error('Invalid authUid: must be a non-empty string');
    }

    // First try to find existing user
    const existingUser = await this.prisma.user.findUnique({
      where: { id: authUid },
    });

    if (existingUser) {
      return existingUser;
    }

    // User doesn't exist, create it
    // Use create instead of upsert to avoid race condition issues
    try {
      return await this.prisma.user.create({
        data: {
          id: authUid,
          knowledgePoints: 0,
          knowledgeLevel: 'A1',
        },
      });
    } catch (error: any) {
      // If unique constraint fails (race condition), fetch the existing user
      if (
        error.code === 'P2002' ||
        error.message?.includes('Unique constraint')
      ) {
        const user = await this.prisma.user.findUnique({
          where: { id: authUid },
        });
        if (user) {
          return user;
        }
      }
      throw error;
    }
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, updateDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
    });
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
