import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LearnService } from './learn.service';
import { PrismaService } from '../prisma/prisma.service';
import { DELIVERY_METHOD } from '@prisma/client';

describe('LearnService', () => {
  let service: LearnService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    userLesson: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    userQuestionPerformance: {
      findMany: jest.fn(),
    },
    userDeliveryMethodScore: {
      findMany: jest.fn(),
    },
    userTeachingCompleted: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    module: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearnService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LearnService>(LearnService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNext', () => {
    it('should return done if lesson has no questions', async () => {
      const userId = 'user-1';
      const lessonId = 'lesson-1';

      prisma.userLesson.upsert.mockResolvedValue({
        userId,
        lessonId,
        completedTeachings: 0,
      } as any);

      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        teachings: [],
      } as any);

      const result = await service.getNext(userId, lessonId);

      expect(result.type).toBe('done');
      expect(result.lessonId).toBe(lessonId);
      expect(result.rationale).toContain('No questions');
    });

    it('should return review if due reviews exist', async () => {
      const userId = 'user-1';
      const lessonId = 'lesson-1';
      const teachingId = 'teaching-1';
      const questionId = 'question-1';

      const mockLesson = {
        id: lessonId,
        teachings: [
          {
            id: teachingId,
            questions: [
              {
                id: questionId,
                questionDeliveryMethods: [
                  { deliveryMethod: DELIVERY_METHOD.FLASHCARD },
                ],
              },
            ],
          },
        ],
      };

      const mockDueReview = {
        id: 'perf-1',
        userId,
        questionId,
        nextReviewDue: new Date(Date.now() - 1000), // Past date
        createdAt: new Date(),
      };

      prisma.userLesson.upsert.mockResolvedValue({
        userId,
        lessonId,
        completedTeachings: 0,
      } as any);

      prisma.lesson.findUnique.mockResolvedValue(mockLesson as any);
      prisma.userQuestionPerformance.findMany.mockResolvedValue([
        mockDueReview,
      ] as any);
      prisma.userDeliveryMethodScore.findMany.mockResolvedValue([]);

      const result = await service.getNext(userId, lessonId);

      expect(result.type).toBe('review');
      expect(result.lessonId).toBe(lessonId);
      expect(result.question).toBeDefined();
    });

    it('should return new content if no due reviews', async () => {
      const userId = 'user-1';
      const lessonId = 'lesson-1';
      const teachingId = 'teaching-1';
      const questionId = 'question-1';

      const mockLesson = {
        id: lessonId,
        teachings: [
          {
            id: teachingId,
            questions: [
              {
                id: questionId,
                questionDeliveryMethods: [
                  { deliveryMethod: DELIVERY_METHOD.FLASHCARD },
                ],
              },
            ],
          },
        ],
      };

      prisma.userLesson.upsert.mockResolvedValue({
        userId,
        lessonId,
        completedTeachings: 0,
      } as any);

      prisma.lesson.findUnique.mockResolvedValue(mockLesson as any);
      prisma.userQuestionPerformance.findMany.mockResolvedValue([]); // No due reviews
      prisma.userDeliveryMethodScore.findMany.mockResolvedValue([]);

      const result = await service.getNext(userId, lessonId);

      expect(result.type).toBe('new');
      expect(result.lessonId).toBe(lessonId);
      expect(result.question).toBeDefined();
    });

    it('should throw NotFoundException if lesson not found', async () => {
      const userId = 'user-1';
      const lessonId = 'non-existent';

      prisma.userLesson.upsert.mockResolvedValue({
        userId,
        lessonId,
        completedTeachings: 0,
      } as any);

      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.getNext(userId, lessonId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSuggestions', () => {
    it('should return suggestions excluding completed content', async () => {
      const userId = 'user-1';
      const limit = 3;

      prisma.userTeachingCompleted.findMany.mockResolvedValue([
        { teachingId: 'teaching-1' },
      ] as any);

      prisma.userLesson.findMany.mockResolvedValue([
        { lessonId: 'lesson-1' },
      ] as any);

      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        knowledgeLevel: 'A1',
      } as any);

      prisma.lesson.findMany.mockResolvedValue([
        {
          id: 'lesson-2',
          title: 'Lesson 2',
          imageUrl: null,
          module: { id: 'module-1', title: 'Module 1' },
        },
      ] as any);

      prisma.module.findMany.mockResolvedValue([
        {
          id: 'module-1',
          title: 'Module 1',
          imageUrl: null,
          lessons: [{ id: 'lesson-2' }],
        },
      ] as any);

      const result = await service.getSuggestions(userId, undefined, undefined, limit);

      expect(result.lessons).toBeDefined();
      expect(result.modules).toBeDefined();
      expect(Array.isArray(result.lessons)).toBe(true);
      expect(Array.isArray(result.modules)).toBe(true);
    });
  });
});
