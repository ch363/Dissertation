import { Test, TestingModule } from '@nestjs/testing';
import { SessionPlanService } from '../session-plan.service';
import { SessionContext } from '../session-types';
import { DELIVERY_METHOD } from '@prisma/client';
import { MasteryService } from '../../mastery/mastery.service';
import { OnboardingPreferencesService } from '../../../onboarding/onboarding-preferences.service';
import { CandidateService } from '../candidate.service';
import { UserPerformanceService } from '../user-performance.service';
import { ContentDataService } from '../content-data.service';
import { StepBuilderService } from '../step-builder.service';

describe('SessionPlanService', () => {
  let service: SessionPlanService;
  let masteryService: any;
  let candidateService: any;
  let userPerformance: any;
  let contentData: any;
  let stepBuilder: any;

  beforeEach(async () => {
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

    const mockCandidateService = {
      getReviewCandidates: jest.fn().mockResolvedValue([]),
      getNewCandidates: jest.fn().mockResolvedValue([]),
    };

    const mockUserPerformanceService = {
      getUserAverageTimes: jest.fn().mockResolvedValue({
        avgTimePerTeachSec: 15,
        avgTimePerPracticeSec: 20,
        avgTimeByDeliveryMethod: new Map(),
        avgTimeByQuestionType: new Map(),
      }),
      getDeliveryMethodScores: jest.fn().mockResolvedValue(new Map()),
      getSeenTeachingIds: jest.fn().mockResolvedValue(new Set()),
    };

    const mockContentDataService = {
      getTeachingCandidates: jest.fn().mockResolvedValue([]),
      getTeachingData: jest.fn(),
      getQuestionData: jest.fn(),
    };

    const mockStepBuilderService = {
      buildPracticeStepItem: jest.fn(),
      buildTitle: jest.fn().mockReturnValue('Learning Session'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionPlanService,
        {
          provide: MasteryService,
          useValue: mockMasteryService,
        },
        {
          provide: OnboardingPreferencesService,
          useValue: mockOnboardingPreferences,
        },
        {
          provide: CandidateService,
          useValue: mockCandidateService,
        },
        {
          provide: UserPerformanceService,
          useValue: mockUserPerformanceService,
        },
        {
          provide: ContentDataService,
          useValue: mockContentDataService,
        },
        {
          provide: StepBuilderService,
          useValue: mockStepBuilderService,
        },
      ],
    }).compile();

    service = module.get<SessionPlanService>(SessionPlanService);
    masteryService = module.get(MasteryService);
    candidateService = module.get(CandidateService);
    userPerformance = module.get(UserPerformanceService);
    contentData = module.get(ContentDataService);
    stepBuilder = module.get(StepBuilderService);
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

      const teachingCandidate = {
        id: 'teaching-1',
        kind: 'teaching' as const,
        teachingId: 'teaching-1',
        lessonId: 'lesson-1',
        dueScore: 0,
        skillMatch: 1,
        difficultyMatch: 0.5,
        deliveryMethods: [],
      };

      const questionCandidate = {
        id: 'question-1',
        kind: 'question' as const,
        teachingId: 'teaching-1',
        lessonId: 'lesson-1',
        dueScore: 0,
        skillMatch: 1,
        difficultyMatch: 0.5,
        deliveryMethods: [DELIVERY_METHOD.MULTIPLE_CHOICE],
      };

      masteryService.getLowMasterySkills.mockResolvedValue(['greetings']);

      candidateService.getNewCandidates.mockResolvedValue([questionCandidate]);
      candidateService.getReviewCandidates.mockResolvedValue([]);

      contentData.getTeachingCandidates.mockResolvedValue([teachingCandidate]);
      contentData.getTeachingData.mockResolvedValue({
        id: 'teaching-1',
        lessonId: 'lesson-1',
        learningLanguageString: 'Ciao',
        userLanguageString: 'Hello',
        emoji: null,
        tip: null,
        knowledgeLevel: 'A1',
      });
      contentData.getQuestionData.mockResolvedValue({
        id: 'question-1',
        teachingId: 'teaching-1',
        type: DELIVERY_METHOD.MULTIPLE_CHOICE,
        variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE }],
      });

      stepBuilder.buildPracticeStepItem.mockResolvedValue({
        type: 'practice',
        questionId: 'question-1',
        teachingId: 'teaching-1',
        lessonId: 'lesson-1',
        deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
        prompt: 'Select the correct answer',
        sourceText: 'Hello',
        options: [
          { id: 'opt1', label: 'Ciao' },
          { id: 'opt2', label: 'Arrivederci' },
        ],
        correctOptionId: 'opt1',
      });

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

      const reviewCandidate = {
        id: 'question-1',
        kind: 'question' as const,
        teachingId: 'teaching-1',
        lessonId: 'lesson-1',
        dueScore: 1,
        skillMatch: 1,
        difficultyMatch: 0.5,
        deliveryMethods: [DELIVERY_METHOD.MULTIPLE_CHOICE],
      };

      masteryService.getLowMasterySkills.mockResolvedValue(['greetings']);

      candidateService.getNewCandidates.mockResolvedValue([]);
      candidateService.getReviewCandidates.mockResolvedValue([reviewCandidate]);

      contentData.getTeachingCandidates.mockResolvedValue([]);
      contentData.getQuestionData.mockResolvedValue({
        id: 'question-1',
        teachingId: 'teaching-1',
        type: DELIVERY_METHOD.MULTIPLE_CHOICE,
        variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE }],
      });

      stepBuilder.buildPracticeStepItem.mockResolvedValue({
        type: 'practice',
        questionId: 'question-1',
        teachingId: 'teaching-1',
        lessonId: 'lesson-1',
        deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
        prompt: 'Select the correct answer',
        sourceText: 'Hello',
        options: [
          { id: 'opt1', label: 'Ciao' },
          { id: 'opt2', label: 'Arrivederci' },
        ],
        correctOptionId: 'opt1',
      });

      const plan = await service.createPlan(userId, context);

      expect(plan.kind).toBe('review');
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.metadata.dueReviewsIncluded).toBeGreaterThan(0);

      const practiceSteps = plan.steps.filter((s) => s.type === 'practice');
      const recapSteps = plan.steps.filter((s) => s.type === 'recap');
      expect(practiceSteps.length).toBeGreaterThan(0);
      expect(recapSteps.length).toBe(1);
    });

    it('should create mixed session plan', async () => {
      const userId = 'user-1';
      const context: SessionContext = {
        mode: 'mixed',
        timeBudgetSec: 900, // 15 minutes
      };

      const reviewCandidate = {
        id: 'question-1',
        kind: 'question' as const,
        teachingId: 'teaching-1',
        lessonId: 'lesson-1',
        dueScore: 1,
        skillMatch: 1,
        difficultyMatch: 0.5,
        deliveryMethods: [DELIVERY_METHOD.MULTIPLE_CHOICE],
      };

      const newCandidate = {
        id: 'question-2',
        kind: 'question' as const,
        teachingId: 'teaching-2',
        lessonId: 'lesson-1',
        dueScore: 0,
        skillMatch: 1,
        difficultyMatch: 0.5,
        deliveryMethods: [DELIVERY_METHOD.MULTIPLE_CHOICE],
      };

      masteryService.getLowMasterySkills.mockResolvedValue(['greetings']);

      candidateService.getNewCandidates.mockResolvedValue([newCandidate]);
      candidateService.getReviewCandidates.mockResolvedValue([reviewCandidate]);

      contentData.getTeachingCandidates.mockResolvedValue([]);
      contentData.getQuestionData.mockImplementation(async (id: string) => ({
        id,
        teachingId: id === 'question-1' ? 'teaching-1' : 'teaching-2',
        type: DELIVERY_METHOD.MULTIPLE_CHOICE,
        variants: [{ deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE }],
      }));

      stepBuilder.buildPracticeStepItem.mockResolvedValue({
        type: 'practice',
        questionId: 'question-1',
        teachingId: 'teaching-1',
        lessonId: 'lesson-1',
        deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
        prompt: 'Select the correct answer',
        sourceText: 'Hello',
        options: [
          { id: 'opt1', label: 'Ciao' },
          { id: 'opt2', label: 'Arrivederci' },
        ],
        correctOptionId: 'opt1',
      });

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

      masteryService.getLowMasterySkills.mockResolvedValue([]);

      candidateService.getNewCandidates.mockResolvedValue([]);
      candidateService.getReviewCandidates.mockResolvedValue([]);

      contentData.getTeachingCandidates.mockResolvedValue([]);

      const plan = await service.createPlan(userId, context);

      expect(plan).toBeDefined();
      // Should still have recap step
      expect(plan.steps.length).toBe(1);
      expect(plan.steps[0].type).toBe('recap');
    });
  });
});
