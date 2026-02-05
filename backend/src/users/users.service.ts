import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { isPrismaError, getErrorMessage } from '../common';
import { BaseCrudService } from '../common/services/base-crud.service';

@Injectable()
export class UsersService extends BaseCrudService<User> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user', 'User');
  }

  async upsertUser(authUid: string) {
    if (!authUid || typeof authUid !== 'string' || authUid.trim() === '') {
      throw new BadRequestException(
        'Invalid authUid: must be a non-empty string',
      );
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
    } catch (error: unknown) {
      // Race condition: another request created the user
      const errorMessage = getErrorMessage(error);
      if (
        (isPrismaError(error) && error.code === 'P2002') ||
        errorMessage.includes('Unique constraint')
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
    return this.update(userId, updateDto);
  }

  async getUser(userId: string) {
    return this.findOne(userId);
  }
}
