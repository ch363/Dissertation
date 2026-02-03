import { Test, TestingModule } from '@nestjs/testing';
import { SessionPlanService } from '../session-plan.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { SessionContext } from '../session-types';
import { DELIVERY_METHOD } from '@prisma/client';
import { ContentLookupService } from '../../../content/content-lookup.service';
import { MasteryService } from '../../mastery/mastery.service';
import { OnboardingPreferencesService } from '../../../onboarding/onboarding-preferences.service';
import { DifficultyCalculator } from '../difficulty-calculator.service';
import { CandidateService } from '../candidate.service';

describe('SessionPlanService', () => {
  let service: SessionPlanService;
  let prisma: any;
  let contentLookup: any;
  let masteryService: any;

  beforeEach(async () => {
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

    const mockContentLookupService = {
      getQuestionData: jest.fn(),
    };

    const mockMasteryService = {
      getLowMasterySkills: jest.fn(),
    };

    const mockOnboardingPreferences = {
      getOnboardingPreferences: jest.fn().mockResolvedValue({
        challengeWeight: 0.5,
        sessionMinutes: null,
        prefersGamification: null,
        feedbackDepth: null,
        learningStyles: [],
        experience: null,
        memoryHabit: null,
      }),
      getInitialDeliveryMethodScores: jest.fn().mockResolvedValue(new Map()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionPlanService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
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
          provide: OnboardingPreferencesService,
          useValue: mockOnboardingPreferences,
        },
        DifficultyCalculator,
        CandidateService,
      ],
    }).compile();

    service = module.get<SessionPlanService>(SessionPlanService);
    prisma = module.get(PrismaService);
    contentLookup = module.get(ContentLookupService);
    masteryService = module.get(MasteryService);
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

      const question1 = {
        id: 'question-1',
        teachingId: 'teaching-1',
        type: DELIVERY_METHOD.MULTIPLE_CHOICE,
        variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE }],
        skillTags: [{ name: 'greetings' }],
        teaching: {
          id: 'teaching-1',
          lessonId: 'lesson-1',
          userLanguageString: 'Hello',
          learningLanguageString: 'Ciao',
          knowledgeLevel: 'A1',
          tip: null,
          lesson: { id: 'lesson-1' },
          skillTags: [{ name: 'greetings' }],
        },
      };

      const teaching1 = {
        id: 'teaching-1',
        lessonId: 'lesson-1',
        userLanguageString: 'Hello',
        learningLanguageString: 'Ciao',
        emoji: null,
        tip: null,
        knowledgeLevel: 'A1',
        lesson: { id: 'lesson-1' },
        skillTags: [{ name: 'greetings' }],
      };

      // Prioritize a skill that exists on the item so rationale is stable.
      masteryService.getLowMasterySkills.mockResolvedValue(['greetings']);

      prisma.userTeachingCompleted.findMany.mockResolvedValue([]);
      prisma.userDeliveryMethodScore.findMany.mockResolvedValue([]);

      // Return the same question list for both lesson filtering + new candidates.
      prisma.question.findMany.mockResolvedValue([question1] as any);

      prisma.question.findUnique.mockImplementation(async (args: any) => {
        if (args?.where?.id === 'question-1') return question1 as any;
        return null;
      });

      prisma.teaching.findMany.mockResolvedValue([teaching1] as any);
      prisma.teaching.findUnique.mockImplementation(async (args: any) => {
        if (args?.where?.id === 'teaching-1') return teaching1 as any;
        return null;
      });

      contentLookup.getQuestionData.mockResolvedValue({
        prompt: 'Select the correct answer',
        sourceText: 'Hello',
        options: [
          { id: 'opt1', label: 'Ciao' },
          { id: 'opt2', label: 'Arrivederci' },
        ],
        correctOptionId: 'opt1',
      });

      prisma.userQuestionPerformance.findMany.mockImplementation(
        async (args: any) => {
          // getUserAverageTimes
          if (args?.select?.timeToComplete !== undefined) return [];
          // attempted questions (distinct)
          if (args?.distinct?.includes('questionId')) return [];
          // due reviews
          if (args?.where?.nextReviewDue?.lte) return [];
          // recent attempts for review candidates
          if (args?.take === 5) return [];
          return [];
        },
      );

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

      // Rationale should exist for teach + practice, and be omitted for recap.
      for (const step of plan.steps) {
        if (step.type === 'recap') {
          expect(step.rationale).toBeUndefined();
        } else {
          expect(step.rationale).toEqual(expect.any(String));
          expect(step.rationale?.length).toBeGreaterThan(0);
        }
      }

      // With low mastery skills mocked, rationale should be stable.
      expect(teachSteps[0].rationale).toContain(
        'Targets low mastery skill: greetings',
      );
      expect(practiceSteps[0].rationale).toContain(
        'Targets low mastery skill: greetings',
      );

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

      const question1 = {
        id: 'question-1',
        teachingId: 'teaching-1',
        type: DELIVERY_METHOD.MULTIPLE_CHOICE,
        variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE }],
        skillTags: [{ name: 'greetings' }],
        teaching: {
          id: 'teaching-1',
          lessonId: 'lesson-1',
          userLanguageString: 'Hello',
          learningLanguageString: 'Ciao',
          knowledgeLevel: 'A1',
          tip: null,
          lesson: { id: 'lesson-1' },
          skillTags: [{ name: 'greetings' }],
        },
      };

      const duePerformances = [
        {
          id: 'perf-1',
          userId: 'user-1',
          questionId: 'question-1',
          nextReviewDue: new Date(now.getTime() - 1000),
          createdAt: new Date(),
          timeToComplete: 5000,
          score: 90,
        },
      ];

      masteryService.getLowMasterySkills.mockResolvedValue(['greetings']);

      prisma.question.findMany.mockResolvedValue([question1] as any);
      prisma.question.findUnique.mockResolvedValue(question1 as any);

      prisma.userTeachingCompleted.findMany.mockResolvedValue([]);
      prisma.userDeliveryMethodScore.findMany.mockResolvedValue([]);

      contentLookup.getQuestionData.mockResolvedValue({
        prompt: 'Select the correct answer',
        sourceText: 'Hello',
        options: [
          { id: 'opt1', label: 'Ciao' },
          { id: 'opt2', label: 'Arrivederci' },
        ],
        correctOptionId: 'opt1',
      });

      prisma.userQuestionPerformance.findMany.mockImplementation(
        async (args: any) => {
          // getUserAverageTimes
          if (args?.select?.timeToComplete !== undefined) return [];
          // attempted questions (distinct)
          if (args?.distinct?.includes('questionId'))
            return [{ questionId: 'question-1' }];
          // recent attempts for difficulty/mastery
          if (args?.take === 5) return [];
          // CandidateService.getReviewCandidates: fetches all performances (no nextReviewDue in where), then filters to latest-per-question due
          if (args?.where?.userId && !args?.where?.nextReviewDue)
            return duePerformances as any;
          return [];
        },
      );

      const plan = await service.createPlan(userId, context);

      expect(plan.kind).toBe('review');
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.metadata.dueReviewsIncluded).toBeGreaterThan(0);

      const practiceSteps = plan.steps.filter((s) => s.type === 'practice');
      const recapSteps = plan.steps.filter((s) => s.type === 'recap');
      expect(practiceSteps.length).toBeGreaterThan(0);
      expect(recapSteps.length).toBe(1);

      // Review steps should explain they're due reviews.
      for (const s of practiceSteps) {
        expect(s.rationale).toBe('Due review');
      }
      expect(recapSteps[0].rationale).toBeUndefined();
    });

    it('should create mixed session plan', async () => {
      const userId = 'user-1';
      const context: SessionContext = {
        mode: 'mixed',
        timeBudgetSec: 900, // 15 minutes
      };

      const now = new Date();

      const question1 = {
        id: 'question-1',
        teachingId: 'teaching-1',
        type: DELIVERY_METHOD.MULTIPLE_CHOICE,
        variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE }],
        skillTags: [{ name: 'greetings' }],
        teaching: {
          id: 'teaching-1',
          lessonId: 'lesson-1',
          userLanguageString: 'Hello',
          learningLanguageString: 'Ciao',
          knowledgeLevel: 'A1',
          tip: null,
          lesson: { id: 'lesson-1' },
          skillTags: [{ name: 'greetings' }],
        },
      };

      const question2 = {
        id: 'question-2',
        teachingId: 'teaching-2',
        type: DELIVERY_METHOD.MULTIPLE_CHOICE,
        variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE }],
        skillTags: [{ name: 'greetings' }],
        teaching: {
          id: 'teaching-2',
          lessonId: 'lesson-1',
          userLanguageString: 'Thank you',
          learningLanguageString: 'Grazie',
          knowledgeLevel: 'A1',
          tip: null,
          lesson: { id: 'lesson-1' },
          skillTags: [{ name: 'greetings' }],
        },
      };

      const teaching2 = {
        id: 'teaching-2',
        lessonId: 'lesson-1',
        userLanguageString: 'Thank you',
        learningLanguageString: 'Grazie',
        emoji: null,
        tip: null,
        knowledgeLevel: 'A1',
        lesson: { id: 'lesson-1' },
        skillTags: [{ name: 'greetings' }],
      };

      const duePerformances = [
        {
          id: 'perf-1',
          userId: 'user-1',
          questionId: 'question-1',
          nextReviewDue: new Date(now.getTime() - 1000),
          createdAt: new Date(),
          timeToComplete: 5000,
          score: 90,
        },
      ];

      masteryService.getLowMasterySkills.mockResolvedValue(['greetings']);

      prisma.question.findMany.mockResolvedValue([question1, question2] as any);

      prisma.question.findUnique.mockImplementation(async (args: any) => {
        const id = args?.where?.id;
        if (id === 'question-1') return question1 as any;
        if (id === 'question-2') return question2 as any;
        return null;
      });

      prisma.teaching.findMany.mockImplementation(async (args: any) => {
        const ids: string[] = args?.where?.id?.in || [];
        if (ids.includes('teaching-2')) return [teaching2] as any;
        return [] as any;
      });

      prisma.teaching.findUnique.mockImplementation(async (args: any) => {
        if (args?.where?.id === 'teaching-2') return teaching2 as any;
        return null;
      });

      prisma.userTeachingCompleted.findMany.mockResolvedValue([]);
      prisma.userDeliveryMethodScore.findMany.mockResolvedValue([]);

      contentLookup.getQuestionData.mockImplementation(
        async (questionId: string) => {
          if (questionId === 'question-1') {
            return {
              prompt: 'Select the correct answer',
              sourceText: 'Hello',
              options: [
                { id: 'opt1', label: 'Ciao' },
                { id: 'opt2', label: 'Arrivederci' },
              ],
              correctOptionId: 'opt1',
            };
          }
          if (questionId === 'question-2') {
            return {
              prompt: 'Select the correct answer',
              sourceText: 'Thank you',
              options: [
                { id: 'opt1', label: 'Grazie' },
                { id: 'opt2', label: 'Prego' },
              ],
              correctOptionId: 'opt1',
            };
          }
          return null;
        },
      );

      prisma.userQuestionPerformance.findMany.mockImplementation(
        async (args: any) => {
          // getUserAverageTimes
          if (args?.select?.timeToComplete !== undefined) return [];
          // attempted questions (distinct)
          if (args?.distinct?.includes('questionId'))
            return [{ questionId: 'question-1' }];
          // recent attempts for difficulty/mastery
          if (args?.take === 5) return [];
          // CandidateService.getReviewCandidates: fetches all performances (no nextReviewDue in where)
          if (args?.where?.userId && !args?.where?.nextReviewDue)
            return duePerformances as any;
          return [];
        },
      );

      const plan = await service.createPlan(userId, context);

      expect(plan.kind).toBe('mixed');
      expect(plan.steps.length).toBeGreaterThan(0);

      // Rationale should exist for teach + practice, and be omitted for recap.
      for (const step of plan.steps) {
        if (step.type === 'recap') {
          expect(step.rationale).toBeUndefined();
        } else {
          expect(step.rationale).toEqual(expect.any(String));
          expect(step.rationale?.length).toBeGreaterThan(0);
        }
      }

      expect(plan.steps.some((s) => s.rationale === 'Due review')).toBe(true);
      expect(
        plan.steps.some((s) =>
          s.rationale?.includes('Targets low mastery skill: greetings'),
        ),
      ).toBe(true);
    });

    it('should handle empty candidates gracefully', async () => {
      const userId = 'user-1';
      const context: SessionContext = {
        mode: 'learn',
        timeBudgetSec: 300,
      };

      masteryService.getLowMasterySkills.mockResolvedValue([]);

      // Mock: No content available
      prisma.userQuestionPerformance.findMany.mockImplementation(
        async (args: any) => {
          // getUserAverageTimes
          if (args?.select?.timeToComplete !== undefined) return [];
          // attempted questions (distinct)
          if (args?.distinct?.includes('questionId')) return [];
          // CandidateService.getReviewCandidates (all performances for user)
          if (args?.where?.userId && !args?.where?.nextReviewDue) return [];
          // recent attempts for review candidates
          if (args?.take === 5) return [];
          return [];
        },
      );
      prisma.question.findMany.mockResolvedValue([]);
      prisma.userTeachingCompleted.findMany.mockResolvedValue([]);
      prisma.userDeliveryMethodScore.findMany.mockResolvedValue([]);

      const plan = await service.createPlan(userId, context);

      expect(plan).toBeDefined();
      // Should still have recap step
      expect(plan.steps.length).toBe(1);
      expect(plan.steps[0].type).toBe('recap');
      expect(plan.steps[0].rationale).toBeUndefined();
    });
  });
});
