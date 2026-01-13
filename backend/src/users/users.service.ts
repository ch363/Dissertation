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
    return this.prisma.user.upsert({
      where: { id: authUid },
      update: {},
      create: {
        id: authUid,
        knowledgePoints: 0,
        knowledgeLevel: 'A1',
      },
    });
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
