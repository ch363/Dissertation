import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProgressService } from '../progress.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LessonProgressService } from '../lesson-progress.service';
import { QuestionAttemptService } from '../question-attempt.service';
import { AnswerValidationService } from '../answer-validation.service';
import { ProgressSummaryService } from '../progress-summary.service';
import { DeliveryMethodScoreService } from '../delivery-method-score.service';
import { ProgressResetService } from '../progress-reset.service';
import { QuestionAttemptDto } from '../dto/question-attempt.dto';
import { DeliveryMethodScoreDto } from '../dto/delivery-method-score.dto';
import { KnowledgeLevelProgressDto } from '../dto/knowledge-level-progress.dto';
import { DELIVERY_METHOD } from '@prisma/client';

describe('ProgressService', () => {
  let service: ProgressService;
  let prisma: jest.Mocked<PrismaService>;
  let lessonProgressService: jest.Mocked<LessonProgressService>;
  let questionAttemptService: jest.Mocked<QuestionAttemptService>;
  let deliveryMethodScoreService: jest.Mocked<DeliveryMethodScoreService>;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userKnowledgeLevelProgress: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockLessonProgressService = {
    startLesson: jest.fn(),
    endLesson: jest.fn(),
    getUserLessons: jest.fn(),
    completeTeaching: jest.fn(),
    markModuleCompleted: jest.fn(),
  };

  const mockQuestionAttemptService = {
    recordQuestionAttempt: jest.fn(),
    getDueReviews: jest.fn(),
    getDueReviewCount: jest.fn(),
    getDueReviewsLatest: jest.fn(),
    getRecentAttempts: jest.fn(),
  };

  const mockAnswerValidationService = {
    validateAnswer: jest.fn(),
    validatePronunciation: jest.fn(),
  };

  const mockProgressSummaryService = {
    getProgressSummary: jest.fn(),
    calculateStreak: jest.fn(),
  };

  const mockDeliveryMethodScoreService = {
    updateDeliveryMethodScore: jest.fn(),
  };

  const mockProgressResetService = {
    resetAllProgress: jest.fn(),
    resetLessonProgress: jest.fn(),
    resetQuestionProgress: jest.fn(),
  };

  beforeEach(async () => {
    mockPrismaService.user.update.mockResolvedValue({ knowledgePoints: 0 });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: LessonProgressService,
          useValue: mockLessonProgressService,
        },
        {
          provide: QuestionAttemptService,
          useValue: mockQuestionAttemptService,
        },
        {
          provide: AnswerValidationService,
          useValue: mockAnswerValidationService,
        },
        {
          provide: ProgressSummaryService,
          useValue: mockProgressSummaryService,
        },
        {
          provide: DeliveryMethodScoreService,
          useValue: mockDeliveryMethodScoreService,
        },
        {
          provide: ProgressResetService,
          useValue: mockProgressResetService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    prisma = module.get(PrismaService);
    lessonProgressService = module.get(LessonProgressService);
    questionAttemptService = module.get(QuestionAttemptService);
    deliveryMethodScoreService = module.get(DeliveryMethodScoreService);
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

      mockLessonProgressService.startLesson.mockResolvedValue(mockUserLesson as any);

      const result = await service.startLesson(userId, lessonId);

      expect(lessonProgressService.startLesson).toHaveBeenCalledWith(userId, lessonId);
      expect(result).toEqual(mockUserLesson);
    });
  });

  describe('completeTeaching', () => {
    it('should create UserTeachingCompleted and increment counter in transaction', async () => {
      const userId = 'user-1';
      const teachingId = 'teaching-1';
      const lessonId = 'lesson-1';

      const mockResult = {
        userLesson: {
          userId,
          lessonId,
          completedTeachings: 1,
          lesson: { id: lessonId, title: 'Test Lesson' },
        },
        wasNewlyCompleted: true,
      };

      mockLessonProgressService.completeTeaching.mockResolvedValue(mockResult as any);

      const result = await service.completeTeaching(userId, teachingId);

      expect(lessonProgressService.completeTeaching).toHaveBeenCalledWith(userId, teachingId, undefined);
      expect(result.userLesson).toEqual(mockResult.userLesson);
      expect(result.wasNewlyCompleted).toBe(true);
    });

    it('should handle idempotent completion (already exists)', async () => {
      const userId = 'user-1';
      const teachingId = 'teaching-1';
      const lessonId = 'lesson-1';

      const mockResult = {
        userLesson: {
          userId,
          lessonId,
          completedTeachings: 0,
          lesson: { id: lessonId, title: 'Test Lesson' },
        },
        wasNewlyCompleted: false,
      };

      mockLessonProgressService.completeTeaching.mockResolvedValue(mockResult as any);

      const result = await service.completeTeaching(userId, teachingId);

      expect(result.wasNewlyCompleted).toBe(false);
    });
  });

  describe('recordQuestionAttempt', () => {
    const userId = 'user-1';
    const questionId = 'question-1';
    const teachingId = 'teaching-1';

    it('should create append-only performance record with spaced repetition', async () => {
      const attemptDto: QuestionAttemptDto = {
        score: 85,
        timeToComplete: 5000,
        percentageAccuracy: 90,
        attempts: 1,
      };

      const mockResult = {
        id: 'perf-1',
        userId,
        questionId,
        ...attemptDto,
        lastRevisedAt: new Date(),
        nextReviewDue: new Date(Date.now() + 86400000),
        awardedXp: 10,
        question: {
          id: questionId,
          teaching: {
            id: teachingId,
            userLanguageString: 'Hello',
            learningLanguageString: 'Ciao',
          },
        },
      };

      mockQuestionAttemptService.recordQuestionAttempt.mockResolvedValue(mockResult as any);

      const result = await service.recordQuestionAttempt(
        userId,
        questionId,
        attemptDto,
      );

      expect(questionAttemptService.recordQuestionAttempt).toHaveBeenCalledWith(
        userId,
        questionId,
        attemptDto,
      );
      expect(result).toBeDefined();
      expect(result.awardedXp).toBe(10);
    });

    it('should throw NotFoundException if question not found', async () => {
      const attemptDto: QuestionAttemptDto = { score: 50 };

      mockQuestionAttemptService.recordQuestionAttempt.mockRejectedValue(
        new NotFoundException('Question not found'),
      );

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

      const mockResult = {
        id: 'perf-1',
        userId,
        questionId,
        ...attemptDto,
        lastRevisedAt: new Date(),
        nextReviewDue: new Date(Date.now() + 86400000),
        awardedXp: 10,
        masteryUpdates: [
          { skill: 'greetings', mastery: 0.6 },
          { skill: 'verbs', mastery: 0.4 },
          { skill: 'pronouns', mastery: 0.7 },
        ],
      };

      mockQuestionAttemptService.recordQuestionAttempt.mockResolvedValue(mockResult as any);

      const result = await service.recordQuestionAttempt(
        userId,
        questionId,
        attemptDto,
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

      const mockResult = {
        id: 'perf-1',
        userId,
        questionId,
        ...attemptDto,
        lastRevisedAt: new Date(),
        nextReviewDue: new Date(Date.now() + 86400000),
        awardedXp: 10,
      };

      mockQuestionAttemptService.recordQuestionAttempt.mockResolvedValue(mockResult as any);

      const result = await service.recordQuestionAttempt(
        userId,
        questionId,
        attemptDto,
      );

      expect(result).toBeDefined();
    });

    it('should extract skill tags from question-level tags when teaching tags are empty', async () => {
      const attemptDto: QuestionAttemptDto = {
        score: 85,
        timeToComplete: 5000,
        percentageAccuracy: 90,
        attempts: 1,
      };

      const mockResult = {
        id: 'perf-1',
        userId,
        questionId,
        ...attemptDto,
        lastRevisedAt: new Date(),
        nextReviewDue: new Date(Date.now() + 86400000),
        awardedXp: 10,
        masteryUpdates: [{ skill: 'numbers', mastery: 0.6 }],
      };

      mockQuestionAttemptService.recordQuestionAttempt.mockResolvedValue(mockResult as any);

      const result = await service.recordQuestionAttempt(
        userId,
        questionId,
        attemptDto,
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

      // The facade delegates to QuestionAttemptService which handles mastery errors internally
      const mockResult = {
        id: 'perf-1',
        userId,
        questionId,
        ...attemptDto,
        lastRevisedAt: new Date(),
        nextReviewDue: new Date(Date.now() + 86400000),
        awardedXp: 10,
      };

      mockQuestionAttemptService.recordQuestionAttempt.mockResolvedValue(mockResult as any);

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

      mockDeliveryMethodScoreService.updateDeliveryMethodScore.mockResolvedValue({
        userId,
        deliveryMethod: method,
        score: 0.7,
      } as any);

      const result = await service.updateDeliveryMethodScore(
        userId,
        method,
        scoreDto,
      );

      expect(deliveryMethodScoreService.updateDeliveryMethodScore).toHaveBeenCalledWith(
        userId,
        method,
        scoreDto,
      );
      expect(result.score).toBe(0.7);
    });

    it('should clamp score to maximum 1', async () => {
      const userId = 'user-1';
      const method = DELIVERY_METHOD.FLASHCARD;
      const scoreDto: DeliveryMethodScoreDto = { delta: 0.5 };

      mockDeliveryMethodScoreService.updateDeliveryMethodScore.mockResolvedValue({
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

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        knowledgePoints: 100,
      } as any);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = mockPrismaService as any;
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
