import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LearnService } from './learn.service';
import { PrismaService } from '../prisma/prisma.service';
import { DELIVERY_METHOD } from '@prisma/client';
import { ContentDeliveryService } from '../engine/content-delivery/content-delivery.service';

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
      findFirst: jest.fn(),
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

  const mockContentDeliveryService = {
    getSessionPlan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearnService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ContentDeliveryService,
          useValue: mockContentDeliveryService,
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

      prisma.userLesson.upsert.mockResolvedValue({
        userId,
        lessonId,
        completedTeachings: 0,
      } as any);

      prisma.lesson.findUnique.mockResolvedValue(mockLesson as any);
      prisma.userQuestionPerformance.findFirst.mockResolvedValue({
        nextReviewDue: new Date(Date.now() - 1000), // Past date (due)
      } as any);
      mockContentDeliveryService.getSessionPlan.mockResolvedValue({
        steps: [
          {
            type: 'practice',
            item: {
              type: 'practice',
              questionId,
              teachingId,
              deliveryMethod: DELIVERY_METHOD.FLASHCARD,
            },
          },
        ],
      } as any);

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
      prisma.userQuestionPerformance.findFirst.mockResolvedValue(null); // No due reviews
      mockContentDeliveryService.getSessionPlan.mockResolvedValue({
        steps: [
          {
            type: 'practice',
            item: {
              type: 'practice',
              questionId,
              teachingId,
              deliveryMethod: DELIVERY_METHOD.FLASHCARD,
            },
          },
        ],
      } as any);

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

    it('should scope lesson suggestions by moduleId when provided', async () => {
      const userId = 'user-1';
      const moduleId = 'module-99';
      const limit = 1;

      prisma.userTeachingCompleted.findMany.mockResolvedValue([] as any);
      prisma.userLesson.findMany.mockResolvedValue([] as any);
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        knowledgeLevel: 'A1',
      } as any);

      prisma.lesson.findMany.mockResolvedValue([
        {
          id: 'lesson-99',
          title: 'Lesson 99',
          imageUrl: null,
          module: { id: moduleId, title: 'Module 99' },
        },
      ] as any);

      prisma.module.findMany.mockResolvedValue([] as any);

      const result = await service.getSuggestions(userId, undefined, moduleId, limit);

      expect(prisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ moduleId }),
        }),
      );
      expect(result.lessons[0]?.module?.id).toBe(moduleId);
    });
  });

  describe('getLearningPath', () => {
    it('should return module cards with completed/total lesson counts', async () => {
      const userId = 'user-1';

      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        knowledgeLevel: 'A1',
      } as any);

      prisma.module.findMany.mockResolvedValue([
        {
          id: 'module-1',
          title: 'Basics',
          description: null,
          lessons: [
            { id: 'lesson-1', _count: { teachings: 3 } },
            { id: 'lesson-2', _count: { teachings: 2 } },
          ],
        },
      ] as any);

      prisma.userLesson.findMany.mockResolvedValue([
        { lessonId: 'lesson-1', completedTeachings: 3 },
        { lessonId: 'lesson-2', completedTeachings: 1 },
      ] as any);

      const cards = await service.getLearningPath(userId);

      expect(cards).toHaveLength(1);
      expect(cards[0]).toEqual(
        expect.objectContaining({
          id: 'module-1',
          title: 'Basics',
          level: 'A1',
          status: 'active',
          completed: 1,
          total: 2,
        }),
      );
    });
  });

  describe('getReviewSummary', () => {
    it('should dedupe due reviews by questionId and return a subtitle', async () => {
      const userId = 'user-1';

      prisma.userQuestionPerformance.findMany.mockResolvedValue([
        { questionId: 'q1', createdAt: new Date('2026-01-01T00:00:00.000Z') },
        { questionId: 'q1', createdAt: new Date('2026-01-02T00:00:00.000Z') },
        { questionId: 'q2', createdAt: new Date('2026-01-03T00:00:00.000Z') },
      ] as any);

      const summary = await service.getReviewSummary(userId);

      expect(summary.dueCount).toBe(2);
      expect(summary.progress).toBeGreaterThanOrEqual(0);
      expect(summary.progress).toBeLessThanOrEqual(1);
      expect(summary.subtitle).toContain('2 items');
    });
  });
});
