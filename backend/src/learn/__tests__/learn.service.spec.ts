import { Test, TestingModule } from '@nestjs/testing';
import { LearnService } from '../learn.service';
import { ContentDeliveryService } from '../../engine/content-delivery/content-delivery.service';
import { LearningPathService } from '../learning-path.service';
import { SuggestionService } from '../suggestion.service';

describe('LearnService', () => {
  let service: LearnService;
  let learningPathService: jest.Mocked<LearningPathService>;
  let suggestionService: jest.Mocked<SuggestionService>;

  const mockContentDeliveryService = {
    getSessionPlan: jest.fn(),
  };

  const mockLearningPathService = {
    getLearningPath: jest.fn(),
    getUserKnowledgeLevel: jest.fn(),
    getModuleProgress: jest.fn(),
  };

  const mockSuggestionService = {
    getSuggestions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearnService,
        {
          provide: ContentDeliveryService,
          useValue: mockContentDeliveryService,
        },
        {
          provide: LearningPathService,
          useValue: mockLearningPathService,
        },
        {
          provide: SuggestionService,
          useValue: mockSuggestionService,
        },
      ],
    }).compile();

    service = module.get<LearnService>(LearnService);
    learningPathService = module.get(LearningPathService);
    suggestionService = module.get(SuggestionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSuggestions', () => {
    it('should return suggestions excluding completed content', async () => {
      const userId = 'user-1';
      const limit = 3;

      mockSuggestionService.getSuggestions.mockResolvedValue({
        lessons: [
          {
            id: 'lesson-2',
            title: 'Lesson 2',
            imageUrl: null,
            module: { id: 'module-1', title: 'Module 1' },
          },
        ],
        modules: [
          {
            id: 'module-1',
            title: 'Module 1',
            imageUrl: null,
          },
        ],
      } as any);

      const result = await service.getSuggestions(
        userId,
        undefined,
        undefined,
        limit,
      );

      expect(suggestionService.getSuggestions).toHaveBeenCalledWith(
        userId,
        undefined,
        undefined,
        limit,
      );
      expect(result.lessons).toBeDefined();
      expect(result.modules).toBeDefined();
      expect(Array.isArray(result.lessons)).toBe(true);
      expect(Array.isArray(result.modules)).toBe(true);
    });

    it('should scope lesson suggestions by moduleId when provided', async () => {
      const userId = 'user-1';
      const moduleId = 'module-99';
      const limit = 1;

      mockSuggestionService.getSuggestions.mockResolvedValue({
        lessons: [
          {
            id: 'lesson-99',
            title: 'Lesson 99',
            imageUrl: null,
            module: { id: moduleId, title: 'Module 99' },
          },
        ],
        modules: [],
      } as any);

      const result = await service.getSuggestions(
        userId,
        undefined,
        moduleId,
        limit,
      );

      expect(suggestionService.getSuggestions).toHaveBeenCalledWith(
        userId,
        undefined,
        moduleId,
        limit,
      );
      expect(result.lessons[0]?.module?.id).toBe(moduleId);
    });
  });

  describe('getLearningPath', () => {
    it('should return module cards with completed/total lesson counts', async () => {
      const userId = 'user-1';

      mockLearningPathService.getLearningPath.mockResolvedValue([
        {
          id: 'module-1',
          title: 'Basics',
          level: 'A1',
          status: 'active',
          completed: 1,
          total: 2,
        },
      ]);

      const cards = await service.getLearningPath(userId);

      expect(learningPathService.getLearningPath).toHaveBeenCalledWith(userId);
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
});
