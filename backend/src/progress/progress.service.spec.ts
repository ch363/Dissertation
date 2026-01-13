import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionAttemptDto } from './dto/question-attempt.dto';
import { DeliveryMethodScoreDto } from './dto/delivery-method-score.dto';
import { KnowledgeLevelProgressDto } from './dto/knowledge-level-progress.dto';
import { DELIVERY_METHOD } from '@prisma/client';

describe('ProgressService', () => {
  let service: ProgressService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    userLesson: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    teaching: {
      findUnique: jest.fn(),
    },
    userTeachingCompleted: {
      create: jest.fn(),
    },
    question: {
      findUnique: jest.fn(),
    },
    userQuestionPerformance: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    userDeliveryMethodScore: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    userKnowledgeLevelProgress: {
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startLesson', () => {
    it('should upsert UserLesson idempotently', async () => {
      const userId = 'user-1';
      const lessonId = 'lesson-1';
      const mockUserLesson = {
        userId,
        lessonId,
        completedTeachings: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lesson: {
          id: lessonId,
          title: 'Test Lesson',
          imageUrl: null,
        },
      };

      prisma.userLesson.upsert.mockResolvedValue(mockUserLesson as any);

      const result = await service.startLesson(userId, lessonId);

      expect(prisma.userLesson.upsert).toHaveBeenCalledWith({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
        update: {
          updatedAt: expect.any(Date),
        },
        create: {
          userId,
          lessonId,
          completedTeachings: 0,
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUserLesson);
    });
  });

  describe('completeTeaching', () => {
    it('should create UserTeachingCompleted and increment counter in transaction', async () => {
      const userId = 'user-1';
      const teachingId = 'teaching-1';
      const lessonId = 'lesson-1';

      const mockTeaching = { lessonId };
      const mockUserLesson = {
        userId,
        lessonId,
        completedTeachings: 1,
        lesson: { id: lessonId, title: 'Test Lesson' },
      };

      // Mock transaction
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = prisma as any;
        tx.teaching.findUnique = jest.fn().mockResolvedValue(mockTeaching);
        tx.userTeachingCompleted.create = jest.fn().mockResolvedValue({});
        tx.userLesson.updateMany = jest.fn().mockResolvedValue({ count: 1 });
        tx.userLesson.findUnique = jest.fn().mockResolvedValue(mockUserLesson);
        return callback(tx);
      });

      const result = await service.completeTeaching(userId, teachingId);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.userLesson).toEqual(mockUserLesson);
      expect(result.wasNewlyCompleted).toBe(true);
    });

    it('should handle idempotent completion (already exists)', async () => {
      const userId = 'user-1';
      const teachingId = 'teaching-1';
      const lessonId = 'lesson-1';

      const mockTeaching = { lessonId };
      const mockUserLesson = {
        userId,
        lessonId,
        completedTeachings: 0,
        lesson: { id: lessonId, title: 'Test Lesson' },
      };

      // Mock transaction where create fails (already exists)
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = prisma as any;
        tx.teaching.findUnique = jest.fn().mockResolvedValue(mockTeaching);
        tx.userTeachingCompleted.create = jest.fn().mockRejectedValue(
          new Error('Unique constraint violation'),
        );
        tx.userLesson.findUnique = jest.fn().mockResolvedValue(mockUserLesson);
        return callback(tx);
      });

      const result = await service.completeTeaching(userId, teachingId);

      expect(result.wasNewlyCompleted).toBe(false);
    });
  });

  describe('recordQuestionAttempt', () => {
    it('should create append-only performance record with spaced repetition', async () => {
      const userId = 'user-1';
      const questionId = 'question-1';
      const attemptDto: QuestionAttemptDto = {
        score: 85,
        timeToComplete: 5000,
        percentageAccuracy: 90,
        attempts: 1,
      };

      prisma.question.findUnique.mockResolvedValue({ id: questionId } as any);
      prisma.userQuestionPerformance.create.mockResolvedValue({
        id: 'perf-1',
        userId,
        questionId,
        ...attemptDto,
        lastRevisedAt: new Date(),
        nextReviewDue: new Date(),
      } as any);

      const result = await service.recordQuestionAttempt(userId, questionId, attemptDto);

      expect(prisma.question.findUnique).toHaveBeenCalledWith({
        where: { id: questionId },
      });
      expect(prisma.userQuestionPerformance.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if question not found', async () => {
      const userId = 'user-1';
      const questionId = 'non-existent';
      const attemptDto: QuestionAttemptDto = { score: 50 };

      prisma.question.findUnique.mockResolvedValue(null);

      await expect(
        service.recordQuestionAttempt(userId, questionId, attemptDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDeliveryMethodScore', () => {
    it('should upsert and clamp score between 0 and 1', async () => {
      const userId = 'user-1';
      const method = DELIVERY_METHOD.FLASHCARD;
      const scoreDto: DeliveryMethodScoreDto = { delta: 0.2 };

      prisma.userDeliveryMethodScore.findUnique.mockResolvedValue({
        userId,
        deliveryMethod: method,
        score: 0.5,
      } as any);

      prisma.userDeliveryMethodScore.upsert.mockResolvedValue({
        userId,
        deliveryMethod: method,
        score: 0.7,
      } as any);

      const result = await service.updateDeliveryMethodScore(userId, method, scoreDto);

      expect(prisma.userDeliveryMethodScore.upsert).toHaveBeenCalled();
      expect(result.score).toBe(0.7);
    });

    it('should clamp score to maximum 1', async () => {
      const userId = 'user-1';
      const method = DELIVERY_METHOD.FLASHCARD;
      const scoreDto: DeliveryMethodScoreDto = { delta: 0.5 };

      prisma.userDeliveryMethodScore.findUnique.mockResolvedValue({
        userId,
        deliveryMethod: method,
        score: 0.8,
      } as any);

      prisma.userDeliveryMethodScore.upsert.mockResolvedValue({
        userId,
        deliveryMethod: method,
        score: 1.0,
      } as any);

      const result = await service.updateDeliveryMethodScore(userId, method, scoreDto);

      expect(result.score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('recordKnowledgeLevelProgress', () => {
    it('should create progress record and increment user knowledgePoints in transaction', async () => {
      const userId = 'user-1';
      const progressDto: KnowledgeLevelProgressDto = { value: 50 };

      const mockProgressRow = {
        id: 'progress-1',
        userId,
        value: 50,
        createdAt: new Date(),
      };

      const mockUpdatedUser = {
        id: userId,
        knowledgePoints: 150,
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = prisma as any;
        tx.userKnowledgeLevelProgress.create = jest
          .fn()
          .mockResolvedValue(mockProgressRow);
        tx.user.update = jest.fn().mockResolvedValue(mockUpdatedUser);
        return callback(tx);
      });

      const result = await service.recordKnowledgeLevelProgress(userId, progressDto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.knowledgePoints).toBe(150);
      expect(result.lastProgressRow).toEqual(mockProgressRow);
    });
  });
});
