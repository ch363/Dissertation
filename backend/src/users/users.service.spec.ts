import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertUser', () => {
    it('should create a new user if not exists', async () => {
      const authUid = 'test-user-id';
      const mockUser = {
        id: authUid,
        name: null,
        knowledgePoints: 0,
        knowledgeLevel: 'A1',
        preferredDeliveryMethod: null,
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser as any);

      const result = await service.upsertUser(authUid);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: authUid } });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          id: authUid,
          knowledgePoints: 0,
          knowledgeLevel: 'A1',
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return existing user if already exists', async () => {
      const authUid = 'existing-user-id';
      const mockUser = {
        id: authUid,
        name: 'Test User',
        knowledgePoints: 100,
        knowledgeLevel: 'B1',
        preferredDeliveryMethod: 'FLASHCARD',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.upsertUser(authUid);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: authUid } });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update user with provided data', async () => {
      const userId = 'test-user-id';
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
        preferredDeliveryMethod: 'MULTIPLE_CHOICE',
      };
      const updatedUser = {
        id: userId,
        name: 'Updated Name',
        knowledgePoints: 0,
        knowledgeLevel: 'A1',
        preferredDeliveryMethod: 'MULTIPLE_CHOICE',
      };

      prisma.user.update.mockResolvedValue(updatedUser as any);

      const result = await service.updateUser(userId, updateDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateDto,
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('getUser', () => {
    it('should return user if found', async () => {
      const userId = 'test-user-id';
      const mockUser = {
        id: userId,
        name: 'Test User',
        knowledgePoints: 50,
        knowledgeLevel: 'A2',
        preferredDeliveryMethod: null,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.getUser(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUser(userId)).rejects.toThrow(NotFoundException);
      await expect(service.getUser(userId)).rejects.toThrow('User not found');
    });
  });
});
