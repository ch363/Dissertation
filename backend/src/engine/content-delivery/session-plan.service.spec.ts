import { Test, TestingModule } from '@nestjs/testing';
import { SessionPlanService } from './session-plan.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionContext } from './session-types';
import { DELIVERY_METHOD } from '@prisma/client';

describe('SessionPlanService', () => {
  let service: SessionPlanService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    userQuestionPerformance: {
      findMany: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    teaching: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userTeachingCompleted: {
      findMany: jest.fn(),
    },
    userDeliveryMethodScore: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionPlanService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SessionPlanService>(SessionPlanService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPlan', () => {
    it('should create a session plan with teach and practice steps', async () => {
      const userId = 'user-1';
      const context: SessionContext = {
        mode: 'learn',
        timeBudgetSec: 300, // 5 minutes
        lessonId: 'lesson-1',
      };

      // Mock: No previous attempts (new content)
      prisma.userQuestionPerformance.findMany.mockResolvedValue([]);

      // Mock: Questions in lesson
      prisma.question.findMany.mockResolvedValue([
        {
          id: 'question-1',
          teachingId: 'teaching-1',
          teaching: {
            id: 'teaching-1',
            lessonId: 'lesson-1',
            userLanguageString: 'Hello',
            learningLanguageString: 'Ciao',
          },
          questionDeliveryMethods: [
            { deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE },
          ],
        },
      ] as any);

      // Mock: Teaching data
      prisma.teaching.findMany.mockResolvedValue([
        {
          id: 'teaching-1',
          lessonId: 'lesson-1',
          userLanguageString: 'Hello',
          learningLanguageString: 'Ciao',
          learningLanguageAudioUrl: null,
          emoji: null,
          tip: null,
          knowledgeLevel: 'A1',
        },
      ] as any);

      prisma.teaching.findUnique.mockResolvedValue({
        id: 'teaching-1',
        lessonId: 'lesson-1',
        userLanguageString: 'Hello',
        learningLanguageString: 'Ciao',
        learningLanguageAudioUrl: null,
        emoji: null,
        tip: null,
        knowledgeLevel: 'A1',
      } as any);

      prisma.question.findUnique.mockResolvedValue({
        id: 'question-1',
        teaching: {
          id: 'teaching-1',
          userLanguageString: 'Hello',
          learningLanguageString: 'Ciao',
        },
        questionDeliveryMethods: [
          { deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE },
        ],
      } as any);

      // Mock: User hasn't seen teaching
      prisma.userTeachingCompleted.findMany.mockResolvedValue([]);

      // Mock: User preferences
      prisma.userDeliveryMethodScore.findMany.mockResolvedValue([]);

      const plan = await service.createPlan(userId, context);

      expect(plan).toBeDefined();
      expect(plan.id).toContain('session-');
      expect(plan.kind).toBe('learn');
      expect(plan.lessonId).toBe('lesson-1');
      expect(plan.steps.length).toBeGreaterThan(0);

      // Should have teach step before practice (teach-then-test)
      const teachSteps = plan.steps.filter((s) => s.type === 'teach');
      const practiceSteps = plan.steps.filter((s) => s.type === 'practice');
      const recapSteps = plan.steps.filter((s) => s.type === 'recap');

      expect(teachSteps.length).toBeGreaterThan(0);
      expect(practiceSteps.length).toBeGreaterThan(0);
      expect(recapSteps.length).toBe(1);

      // Metadata should be populated
      expect(plan.metadata.totalSteps).toBe(plan.steps.length);
      expect(plan.metadata.teachSteps).toBe(teachSteps.length);
      expect(plan.metadata.practiceSteps).toBe(practiceSteps.length);
      expect(plan.metadata.recapSteps).toBe(1);
    });

    it('should create review session plan', async () => {
      const userId = 'user-1';
      const context: SessionContext = {
        mode: 'review',
        timeBudgetSec: 600, // 10 minutes
      };

      const now = new Date();

      // Mock: Due reviews
      prisma.userQuestionPerformance.findMany
        .mockResolvedValueOnce([
          {
            id: 'perf-1',
            userId: 'user-1',
            questionId: 'question-1',
            nextReviewDue: new Date(now.getTime() - 1000),
            createdAt: new Date(),
            timeToComplete: 5000,
          },
        ] as any)
        .mockResolvedValueOnce([]) // For getUserAverageTimes
        .mockResolvedValueOnce([]); // For getSeenTeachingIds

      prisma.question.findUnique.mockResolvedValue({
        id: 'question-1',
        teaching: {
          id: 'teaching-1',
          lessonId: 'lesson-1',
          userLanguageString: 'Hello',
          learningLanguageString: 'Ciao',
        },
        questionDeliveryMethods: [
          { deliveryMethod: DELIVERY_METHOD.FLASHCARD },
        ],
      } as any);

      prisma.userTeachingCompleted.findMany.mockResolvedValue([]);
      prisma.userDeliveryMethodScore.findMany.mockResolvedValue([]);

      const plan = await service.createPlan(userId, context);

      expect(plan.kind).toBe('review');
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.metadata.dueReviewsIncluded).toBeGreaterThan(0);
    });

    it('should create mixed session plan', async () => {
      const userId = 'user-1';
      const context: SessionContext = {
        mode: 'mixed',
        timeBudgetSec: 900, // 15 minutes
      };

      const now = new Date();

      // Mock: Some due reviews
      prisma.userQuestionPerformance.findMany
        .mockResolvedValueOnce([
          {
            id: 'perf-1',
            userId: 'user-1',
            questionId: 'question-1',
            nextReviewDue: new Date(now.getTime() - 1000),
            createdAt: new Date(),
            timeToComplete: 5000,
          },
        ] as any)
        .mockResolvedValueOnce([]) // For getUserAverageTimes
        .mockResolvedValueOnce([]) // For attempted questions
        .mockResolvedValueOnce([]); // For getSeenTeachingIds

      prisma.question.findMany.mockResolvedValue([
        {
          id: 'question-2',
          teachingId: 'teaching-1',
          teaching: {
            id: 'teaching-1',
            lessonId: 'lesson-1',
            userLanguageString: 'Hello',
            learningLanguageString: 'Ciao',
          },
          questionDeliveryMethods: [
            { deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE },
          ],
        },
      ] as any);

      prisma.question.findUnique.mockResolvedValue({
        id: 'question-1',
        teaching: {
          id: 'teaching-1',
          lessonId: 'lesson-1',
          userLanguageString: 'Hello',
          learningLanguageString: 'Ciao',
        },
        questionDeliveryMethods: [
          { deliveryMethod: DELIVERY_METHOD.FLASHCARD },
        ],
      } as any);

      prisma.userTeachingCompleted.findMany.mockResolvedValue([]);
      prisma.userDeliveryMethodScore.findMany.mockResolvedValue([]);

      const plan = await service.createPlan(userId, context);

      expect(plan.kind).toBe('mixed');
      expect(plan.steps.length).toBeGreaterThan(0);
    });

    it('should handle empty candidates gracefully', async () => {
      const userId = 'user-1';
      const context: SessionContext = {
        mode: 'learn',
        timeBudgetSec: 300,
      };

      // Mock: No content available
      prisma.userQuestionPerformance.findMany.mockResolvedValue([]);
      prisma.question.findMany.mockResolvedValue([]);
      prisma.userTeachingCompleted.findMany.mockResolvedValue([]);
      prisma.userDeliveryMethodScore.findMany.mockResolvedValue([]);

      const plan = await service.createPlan(userId, context);

      expect(plan).toBeDefined();
      // Should still have recap step
      expect(plan.steps.length).toBe(1);
      expect(plan.steps[0].type).toBe('recap');
    });
  });
});
