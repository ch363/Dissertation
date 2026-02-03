import { Test, TestingModule } from '@nestjs/testing';
import { CandidateService } from '../candidate.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DifficultyCalculator } from '../difficulty-calculator.service';
import { DELIVERY_METHOD } from '@prisma/client';

describe('CandidateService', () => {
  let service: CandidateService;
  let prisma: {
    userQuestionPerformance: { findMany: jest.Mock };
    question: { findMany: jest.Mock; findUnique: jest.Mock };
  };

  const now = new Date();
  const questionWithMetadata = {
    id: 'question-1',
    teachingId: 'teaching-1',
    knowledgeLevel: 'A1',
    variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE }],
    skillTags: [{ name: 'greetings' }],
    teaching: {
      id: 'teaching-1',
      lessonId: 'lesson-1',
      knowledgeLevel: 'A1',
      tip: null,
      lesson: { id: 'lesson-1' },
      skillTags: [{ name: 'greetings' }],
    },
  };

  beforeEach(async () => {
    const mockPrismaService = {
      userQuestionPerformance: {
        findMany: jest.fn(),
      },
      question: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateService,
        DifficultyCalculator,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CandidateService>(CandidateService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getReviewCandidates', () => {
    it('returns due items with all metadata', async () => {
      const userId = 'user-1';
      const duePerf = {
        id: 'perf-1',
        userId: 'user-1',
        questionId: 'question-1',
        nextReviewDue: new Date(now.getTime() - 3600000),
        createdAt: new Date(),
        score: 85,
        deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
      };

      prisma.question.findMany.mockResolvedValue([{ id: 'question-1' }]);
      prisma.userQuestionPerformance.findMany
        .mockResolvedValueOnce([duePerf])
        .mockResolvedValueOnce([
          { ...duePerf, score: 90, createdAt: new Date() },
        ]);
      prisma.question.findUnique.mockResolvedValue(questionWithMetadata);

      const candidates = await service.getReviewCandidates(userId);

      expect(candidates).toHaveLength(1);
      const c = candidates[0];
      expect(c.kind).toBe('question');
      expect(c.id).toBe('question-1');
      expect(c.questionId).toBe('question-1');
      expect(c.teachingId).toBe('teaching-1');
      expect(c.lessonId).toBe('lesson-1');
      expect(c.dueScore).toBeGreaterThanOrEqual(0);
      expect(c.errorScore).toBeDefined();
      expect(c.timeSinceLastSeen).toBeDefined();
      expect(c.deliveryMethods).toEqual([DELIVERY_METHOD.MULTIPLE_CHOICE]);
      expect(c.skillTags).toEqual(['greetings']);
      expect(c.exerciseType).toBeDefined();
      expect(c.difficulty).toBeDefined();
      expect(c.estimatedMastery).toBeDefined();
    });

    it('filters by lessonId', async () => {
      prisma.question.findMany.mockResolvedValue([]);
      await service.getReviewCandidates('user-1', { lessonId: 'lesson-1' });
      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teaching: { lessonId: 'lesson-1' } },
          select: { id: true },
        }),
      );
    });

    it('returns empty array when lesson has no questions', async () => {
      prisma.question.findMany.mockResolvedValue([]);
      const candidates = await service.getReviewCandidates('user-1', {
        lessonId: 'lesson-1',
      });
      expect(candidates).toEqual([]);
      expect(prisma.userQuestionPerformance.findMany).not.toHaveBeenCalled();
    });

    it('filters by moduleId', async () => {
      prisma.question.findMany.mockResolvedValue([{ id: 'q1' }]);
      prisma.userQuestionPerformance.findMany.mockResolvedValue([]);
      await service.getReviewCandidates('user-1', { moduleId: 'module-1' });
      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            teaching: { lesson: { moduleId: 'module-1' } },
          },
          select: { id: true },
        }),
      );
    });

    it('deduplicates by questionId keeping latest performance', async () => {
      const older = {
        id: 'perf-1',
        userId: 'user-1',
        questionId: 'question-1',
        nextReviewDue: new Date(now.getTime() - 3600000),
        createdAt: new Date(now.getTime() - 10000),
        score: 70,
        deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
      };
      const newer = {
        ...older,
        id: 'perf-2',
        createdAt: new Date(now.getTime() - 1000),
        nextReviewDue: new Date(now.getTime() - 2000000),
      };
      prisma.question.findMany.mockResolvedValue([{ id: 'question-1' }]);
      prisma.userQuestionPerformance.findMany
        .mockResolvedValueOnce([older, newer])
        .mockResolvedValueOnce([newer]);
      prisma.question.findUnique.mockResolvedValue(questionWithMetadata);

      const candidates = await service.getReviewCandidates('user-1');
      expect(candidates).toHaveLength(1);
      expect(candidates[0].dueScore).toBeGreaterThanOrEqual(0);
    });

    it('handles missing database columns by returning empty array', async () => {
      prisma.userQuestionPerformance.findMany.mockRejectedValue(
        new Error('column "nextReviewDue" does not exist'),
      );
      const candidates = await service.getReviewCandidates('user-1');
      expect(candidates).toEqual([]);
    });

    it('rethrows non-schema errors', async () => {
      prisma.userQuestionPerformance.findMany.mockRejectedValue(
        new Error('Connection refused'),
      );
      await expect(
        service.getReviewCandidates('user-1'),
      ).rejects.toThrow('Connection refused');
    });
  });

  describe('getNewCandidates', () => {
    it('returns new items not yet attempted with enhanced metadata', async () => {
      prisma.question.findMany.mockResolvedValue([
        {
          ...questionWithMetadata,
          id: 'question-new',
          teaching: {
            ...questionWithMetadata.teaching,
            lessonId: 'lesson-1',
          },
        },
      ]);
      prisma.userQuestionPerformance.findMany.mockResolvedValue([]);

      const candidates = await service.getNewCandidates('user-1');

      expect(candidates).toHaveLength(1);
      const c = candidates[0];
      expect(c.kind).toBe('question');
      expect(c.dueScore).toBe(0);
      expect(c.errorScore).toBe(0);
      expect(c.timeSinceLastSeen).toBe(Infinity);
      expect(c.estimatedMastery).toBe(0);
      expect(c.skillTags).toEqual(['greetings']);
      expect(c.exerciseType).toBeDefined();
      expect(c.difficulty).toBeDefined();
      expect(c.deliveryMethods).toBeDefined();
    });

    it('filters by lessonId', async () => {
      prisma.question.findMany.mockResolvedValue([]);
      prisma.userQuestionPerformance.findMany.mockResolvedValue([]);
      await service.getNewCandidates('user-1', { lessonId: 'lesson-1' });
      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teaching: { lessonId: 'lesson-1' } },
        }),
      );
    });

    it('filters by moduleId', async () => {
      prisma.question.findMany.mockResolvedValue([]);
      prisma.userQuestionPerformance.findMany.mockResolvedValue([]);
      await service.getNewCandidates('user-1', { moduleId: 'module-1' });
      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teaching: { lesson: { moduleId: 'module-1' } } },
        }),
      );
    });

    it('excludes already attempted questions', async () => {
      prisma.question.findMany.mockResolvedValue([
        {
          ...questionWithMetadata,
          id: 'q1',
        },
        {
          ...questionWithMetadata,
          id: 'q2',
        },
      ]);
      prisma.userQuestionPerformance.findMany.mockResolvedValue([
        { questionId: 'q1' },
      ]);

      const candidates = await service.getNewCandidates('user-1');
      expect(candidates).toHaveLength(1);
      expect(candidates[0].id).toBe('q2');
    });

    it('accepts prioritizedSkills in options without changing result shape', async () => {
      prisma.question.findMany.mockResolvedValue([]);
      prisma.userQuestionPerformance.findMany.mockResolvedValue([]);
      const candidates = await service.getNewCandidates('user-1', {
        prioritizedSkills: ['greetings'],
      });
      expect(candidates).toEqual([]);
    });
  });
});
