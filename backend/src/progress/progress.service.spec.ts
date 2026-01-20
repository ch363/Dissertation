import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionAttemptDto } from './dto/question-attempt.dto';
import { DeliveryMethodScoreDto } from './dto/delivery-method-score.dto';
import { KnowledgeLevelProgressDto } from './dto/knowledge-level-progress.dto';
import { DELIVERY_METHOD } from '@prisma/client';
import { SrsService } from '../engine/srs/srs.service';
import { XpService } from '../engine/scoring/xp.service';
import { ContentLookupService } from '../content/content-lookup.service';
import { MasteryService } from '../engine/mastery/mastery.service';
import { SessionPlanCacheService } from '../engine/content-delivery/session-plan-cache.service';
import { PronunciationService } from '../speech/pronunciation/pronunciation.service';

describe('ProgressService', () => {
  let service: ProgressService;
  let prisma: jest.Mocked<PrismaService>;
  let srsService: jest.Mocked<SrsService>;
  let xpService: jest.Mocked<XpService>;
  let contentLookup: jest.Mocked<ContentLookupService>;
  let masteryService: jest.Mocked<MasteryService>;
  let sessionPlanCache: jest.Mocked<SessionPlanCacheService>;
  let pronunciationService: jest.Mocked<PronunciationService>;

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
      findUnique: jest.fn(),
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
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockSrsService = {
    calculateQuestionState: jest.fn(),
  };

  const mockXpService = {
    award: jest.fn(),
  };

  const mockContentLookupService = {
    getQuestionData: jest.fn(),
  };

  const mockMasteryService = {
    updateMastery: jest.fn(),
  };

  const mockSessionPlanCacheService = {
    invalidate: jest.fn(),
  };

  const mockPronunciationService = {
    assess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SrsService,
          useValue: mockSrsService,
        },
        {
          provide: XpService,
          useValue: mockXpService,
        },
        {
          provide: ContentLookupService,
          useValue: mockContentLookupService,
        },
        {
          provide: MasteryService,
          useValue: mockMasteryService,
        },
        {
          provide: SessionPlanCacheService,
          useValue: mockSessionPlanCacheService,
        },
        {
          provide: PronunciationService,
          useValue: mockPronunciationService,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    prisma = module.get(PrismaService);
    srsService = module.get(SrsService);
    xpService = module.get(XpService);
    contentLookup = module.get(ContentLookupService);
    masteryService = module.get(MasteryService);
    sessionPlanCache = module.get(SessionPlanCacheService);
    pronunciationService = module.get(PronunciationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset all service mocks
    mockSrsService.calculateQuestionState.mockReset();
    mockXpService.award.mockReset();
    mockContentLookupService.getQuestionData.mockReset();
    mockMasteryService.updateMastery.mockReset();
    mockSessionPlanCacheService.invalidate.mockReset();
    mockPronunciationService.assess.mockReset();
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
        tx.userTeachingCompleted.findUnique = jest.fn().mockResolvedValue(null);
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

      // Mock transaction where completion already exists
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = prisma as any;
        tx.teaching.findUnique = jest.fn().mockResolvedValue(mockTeaching);
        tx.userTeachingCompleted.findUnique = jest
          .fn()
          .mockResolvedValue({ userId, teachingId });
        tx.userLesson.updateMany = jest.fn().mockResolvedValue({ count: 0 });
        tx.userLesson.findUnique = jest.fn().mockResolvedValue(mockUserLesson);
        return callback(tx);
      });

      const result = await service.completeTeaching(userId, teachingId);

      expect(result.wasNewlyCompleted).toBe(false);
    });
  });

  describe('recordQuestionAttempt', () => {
    const userId = 'user-1';
    const questionId = 'question-1';
    const teachingId = 'teaching-1';
    const lessonId = 'lesson-1';

    const mockSrsState = {
      nextReviewDue: new Date(Date.now() + 86400000), // 1 day from now
      intervalDays: 1,
      stability: 1.0,
      difficulty: 0.3,
      repetitions: 1,
    };

    beforeEach(() => {
      mockSrsService.calculateQuestionState.mockResolvedValue(mockSrsState);
      mockXpService.award.mockResolvedValue(10);
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        knowledgePoints: 100,
      } as any);
    });

    it('should create append-only performance record with spaced repetition', async () => {
      const attemptDto: QuestionAttemptDto = {
        score: 85,
        timeToComplete: 5000,
        percentageAccuracy: 90,
        attempts: 1,
      };

      const mockQuestion = {
        id: questionId,
        teachingId,
        type: DELIVERY_METHOD.FLASHCARD,
        skillTags: [],
        teaching: {
          id: teachingId,
          lessonId,
          skillTags: [],
          lesson: {
            id: lessonId,
            title: 'Test Lesson',
          },
        },
      };

      prisma.question.findUnique.mockResolvedValue(mockQuestion as any);
      prisma.userQuestionPerformance.create.mockResolvedValue({
        id: 'perf-1',
        userId,
        questionId,
        ...attemptDto,
        lastRevisedAt: new Date(),
        nextReviewDue: mockSrsState.nextReviewDue,
        question: {
          id: questionId,
          teaching: {
            id: teachingId,
            userLanguageString: 'Hello',
            learningLanguageString: 'Ciao',
          },
        },
      } as any);

      const result = await service.recordQuestionAttempt(
        userId,
        questionId,
        attemptDto,
      );

      expect(prisma.question.findUnique).toHaveBeenCalledWith({
        where: { id: questionId },
        include: {
          teaching: {
            include: {
              lesson: {
                select: {
                  id: true,
                  title: true,
                },
              },
              skillTags: {
                select: {
                  name: true,
                },
              },
            },
          },
          skillTags: {
            select: {
              name: true,
            },
          },
        },
      });
      expect(prisma.userQuestionPerformance.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.awardedXp).toBe(10);
    });

    it('should throw NotFoundException if question not found', async () => {
      const attemptDto: QuestionAttemptDto = { score: 50 };

      prisma.question.findUnique.mockResolvedValue(null);

      await expect(
        service.recordQuestionAttempt(userId, questionId, attemptDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should extract skill tags from loaded relations and update mastery', async () => {
      const attemptDto: QuestionAttemptDto = {
        score: 85,
        timeToComplete: 5000,
        percentageAccuracy: 90,
        attempts: 1,
      };

      const mockQuestion = {
        id: questionId,
        teachingId,
        type: DELIVERY_METHOD.FLASHCARD,
        skillTags: [{ name: 'greetings' }, { name: 'verbs' }],
        teaching: {
          id: teachingId,
          lessonId,
          skillTags: [{ name: 'greetings' }, { name: 'pronouns' }],
          lesson: {
            id: lessonId,
            title: 'Test Lesson',
          },
        },
      };

      prisma.question.findUnique.mockResolvedValue(mockQuestion as any);
      prisma.userQuestionPerformance.create.mockResolvedValue({
        id: 'perf-1',
        userId,
        questionId,
        ...attemptDto,
        lastRevisedAt: new Date(),
        nextReviewDue: mockSrsState.nextReviewDue,
        question: {
          id: questionId,
          teaching: {
            id: teachingId,
            userLanguageString: 'Hello',
            learningLanguageString: 'Ciao',
          },
        },
      } as any);

      // Mock mastery updates - return different mastery values
      mockMasteryService.updateMastery
        .mockResolvedValueOnce(0.6) // greetings - above threshold
        .mockResolvedValueOnce(0.4) // verbs - below threshold
        .mockResolvedValueOnce(0.7); // pronouns - above threshold

      const result = await service.recordQuestionAttempt(
        userId,
        questionId,
        attemptDto,
      );

      // Verify skillTags relation was loaded
      expect(prisma.question.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            skillTags: {
              select: {
                name: true,
              },
            },
            teaching: expect.objectContaining({
              include: expect.objectContaining({
                skillTags: {
                  select: {
                    name: true,
                  },
                },
              }),
            }),
          }),
        }),
      );

      // Verify mastery was updated for all skill tags (greetings, verbs, pronouns)
      // Note: extractSkillTags deduplicates, so 'greetings' appears once
      expect(mockMasteryService.updateMastery).toHaveBeenCalledTimes(3);
      expect(mockMasteryService.updateMastery).toHaveBeenCalledWith(
        userId,
        'greetings',
        true,
      );
      expect(mockMasteryService.updateMastery).toHaveBeenCalledWith(
        userId,
        'verbs',
        true,
      );
      expect(mockMasteryService.updateMastery).toHaveBeenCalledWith(
        userId,
        'pronouns',
        true,
      );

      expect(result).toBeDefined();
    });

    it('should handle questions with no skill tags gracefully', async () => {
      const attemptDto: QuestionAttemptDto = {
        score: 85,
        timeToComplete: 5000,
        percentageAccuracy: 90,
        attempts: 1,
      };

      const mockQuestion = {
        id: questionId,
        teachingId,
        type: DELIVERY_METHOD.FLASHCARD,
        skillTags: [],
        teaching: {
          id: teachingId,
          lessonId,
          skillTags: [],
          lesson: {
            id: lessonId,
            title: 'Test Lesson',
          },
        },
      };

      prisma.question.findUnique.mockResolvedValue(mockQuestion as any);
      prisma.userQuestionPerformance.create.mockResolvedValue({
        id: 'perf-1',
        userId,
        questionId,
        ...attemptDto,
        lastRevisedAt: new Date(),
        nextReviewDue: mockSrsState.nextReviewDue,
        question: {
          id: questionId,
          teaching: {
            id: teachingId,
            userLanguageString: 'Hello',
            learningLanguageString: 'Ciao',
          },
        },
      } as any);

      const result = await service.recordQuestionAttempt(
        userId,
        questionId,
        attemptDto,
      );

      // Verify skillTags relation was still loaded (even if empty)
      expect(prisma.question.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            skillTags: {
              select: {
                name: true,
              },
            },
          }),
        }),
      );

      // Verify mastery service was not called when no skill tags
      expect(mockMasteryService.updateMastery).not.toHaveBeenCalled();

      expect(result).toBeDefined();
    });

    it('should extract skill tags from question-level tags when teaching tags are empty', async () => {
      const attemptDto: QuestionAttemptDto = {
        score: 85,
        timeToComplete: 5000,
        percentageAccuracy: 90,
        attempts: 1,
      };

      const mockQuestion = {
        id: questionId,
        teachingId,
        type: DELIVERY_METHOD.FLASHCARD,
        skillTags: [{ name: 'numbers' }],
        teaching: {
          id: teachingId,
          lessonId,
          skillTags: [],
          lesson: {
            id: lessonId,
            title: 'Test Lesson',
          },
        },
      };

      prisma.question.findUnique.mockResolvedValue(mockQuestion as any);
      prisma.userQuestionPerformance.create.mockResolvedValue({
        id: 'perf-1',
        userId,
        questionId,
        ...attemptDto,
        lastRevisedAt: new Date(),
        nextReviewDue: mockSrsState.nextReviewDue,
        question: {
          id: questionId,
          teaching: {
            id: teachingId,
            userLanguageString: 'Hello',
            learningLanguageString: 'Ciao',
          },
        },
      } as any);

      mockMasteryService.updateMastery.mockResolvedValue(0.6);

      const result = await service.recordQuestionAttempt(
        userId,
        questionId,
        attemptDto,
      );

      // Verify mastery was updated for the question-level skill tag
      expect(mockMasteryService.updateMastery).toHaveBeenCalledTimes(1);
      expect(mockMasteryService.updateMastery).toHaveBeenCalledWith(
        userId,
        'numbers',
        true,
      );

      expect(result).toBeDefined();
    });

    it('should handle mastery update errors gracefully without failing the attempt', async () => {
      const attemptDto: QuestionAttemptDto = {
        score: 85,
        timeToComplete: 5000,
        percentageAccuracy: 90,
        attempts: 1,
      };

      const mockQuestion = {
        id: questionId,
        teachingId,
        type: DELIVERY_METHOD.FLASHCARD,
        skillTags: [{ name: 'greetings' }],
        teaching: {
          id: teachingId,
          lessonId,
          skillTags: [],
          lesson: {
            id: lessonId,
            title: 'Test Lesson',
          },
        },
      };

      prisma.question.findUnique.mockResolvedValue(mockQuestion as any);
      prisma.userQuestionPerformance.create.mockResolvedValue({
        id: 'perf-1',
        userId,
        questionId,
        ...attemptDto,
        lastRevisedAt: new Date(),
        nextReviewDue: mockSrsState.nextReviewDue,
        question: {
          id: questionId,
          teaching: {
            id: teachingId,
            userLanguageString: 'Hello',
            learningLanguageString: 'Ciao',
          },
        },
      } as any);

      // Mock mastery service to throw an error
      mockMasteryService.updateMastery.mockRejectedValue(
        new Error('Mastery update failed'),
      );

      // Should not throw - mastery tracking is non-critical
      const result = await service.recordQuestionAttempt(
        userId,
        questionId,
        attemptDto,
      );

      expect(result).toBeDefined();
      expect(result.awardedXp).toBe(10);
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

      const result = await service.updateDeliveryMethodScore(
        userId,
        method,
        scoreDto,
      );

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

      const result = await service.updateDeliveryMethodScore(
        userId,
        method,
        scoreDto,
      );

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

      const result = await service.recordKnowledgeLevelProgress(
        userId,
        progressDto,
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.knowledgePoints).toBe(150);
      expect(result.lastProgressRow).toEqual(mockProgressRow);
    });
  });
});
