import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async upsertUser(authUid: string) {
    if (!authUid || typeof authUid !== 'string' || authUid.trim() === '') {
      throw new Error('Invalid authUid: must be a non-empty string');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id: authUid },
    });

    if (existingUser) {
      return existingUser;
    }

    try {
      return await this.prisma.user.create({
        data: {
          id: authUid,
          knowledgePoints: 0,
          knowledgeLevel: 'A1',
        },
      });
    } catch (error: any) {
      // Race condition: another request created the user
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

  async updateUser(userId: string, updateDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
    });
  }

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
