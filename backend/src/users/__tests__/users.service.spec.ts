import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { UpdateUserDto } from '../dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: any;

  beforeEach(async () => {
    mockUserRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
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

      mockUserRepository.findById.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await service.upsertUser(authUid);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(authUid);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        id: authUid,
        knowledgePoints: 0,
        knowledgeLevel: 'A1',
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

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.upsertUser(authUid);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(authUid);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
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

      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateDto);

      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, updateDto);
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

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUser(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.getUser(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
