import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { isPrismaError, getErrorMessage } from '../common';
import { UserRepository } from './users.repository';
import { LoggerService } from '../common/logger';

/**
 * UsersService
 *
 * Business logic layer for User operations.
 * Uses repository pattern for data access (Dependency Inversion Principle).
 */
@Injectable()
export class UsersService {
  private readonly logger = new LoggerService(UsersService.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Upsert a user by auth UID.
   * Creates user if not exists, returns existing user if found.
   */
  async upsertUser(authUid: string): Promise<User> {
    if (!authUid || typeof authUid !== 'string' || authUid.trim() === '') {
      throw new BadRequestException(
        'Invalid authUid: must be a non-empty string',
      );
    }

    const existingUser = await this.userRepository.findById(authUid);

    if (existingUser) {
      return existingUser;
    }

    try {
      return await this.userRepository.create({
        id: authUid,
        knowledgePoints: 0,
        knowledgeLevel: 'A1',
      });
    } catch (error: unknown) {
      // Race condition: another request created the user
      const errorMessage = getErrorMessage(error);
      if (
        (isPrismaError(error) && error.code === 'P2002') ||
        errorMessage.includes('Unique constraint')
      ) {
        const user = await this.userRepository.findById(authUid);
        if (user) {
          return user;
        }
      }
      throw error;
    }
  }

  /**
   * Update a user's profile.
   */
  async updateUser(userId: string, updateDto: UpdateUserDto): Promise<User> {
    return this.userRepository.update(userId, updateDto);
  }

  /**
   * Get a user by ID.
   */
  async getUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  /**
   * Find all users.
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  /**
   * Find a user by ID (returns null if not found).
   */
  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  /**
   * Count total users.
   */
  async count(): Promise<number> {
    return this.userRepository.count();
  }
}
