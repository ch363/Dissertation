import { Injectable } from '@nestjs/common';
import { DeliveryCandidate } from './types';
import { CandidateService } from './candidate.service';
import { LoggerService } from '../../common/logger';
import { TeachingRepository } from '../../teachings/teachings.repository';
import { QuestionRepository } from '../../questions/questions.repository';

/**
 * ContentDataService
 *
 * Retrieves teaching and question data from the database.
 * Follows Single Responsibility Principle - focused on content data retrieval.
 * Follows Dependency Inversion Principle - depends on repository interfaces.
 */
@Injectable()
export class ContentDataService {
  private readonly logger = new LoggerService(ContentDataService.name);

  constructor(
    private teachingRepository: TeachingRepository,
    private questionRepository: QuestionRepository,
    private candidateService: CandidateService,
  ) {}

  /**
   * Get teaching data by ID.
   */
  async getTeachingData(teachingId: string) {
    return this.teachingRepository.findByIdWithSkillTags(teachingId);
  }

  /**
   * Get question data by ID.
   */
  async getQuestionData(questionId: string) {
    return this.questionRepository.findByIdWithTeachingAndSkillTags(questionId);
  }

  /**
   * Get teaching candidates for new question candidates.
   * Filters out teachings the user has already seen.
   */
  async getTeachingCandidates(
    userId: string,
    questionCandidates: DeliveryCandidate[],
    seenTeachingIds: Set<string>,
    lessonId?: string,
    moduleId?: string,
  ): Promise<DeliveryCandidate[]> {
    const teachingIds = new Set(
      questionCandidates
        .map((c) => c.teachingId)
        .filter((id): id is string => !!id),
    );

    if (teachingIds.size === 0) {
      return [];
    }

    const teachings = await this.teachingRepository.findManyWithFilters({
      ids: Array.from(teachingIds),
      lessonId,
      moduleId,
    });

    return teachings
      .filter((teaching) => !seenTeachingIds.has(teaching.id))
      .map((teaching) => {
        const skillTags = this.candidateService.extractSkillTags(teaching);
        return {
          kind: 'teaching' as const,
          id: teaching.id,
          teachingId: teaching.id,
          lessonId: teaching.lessonId,
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: Infinity,
          title: teaching.userLanguageString,
          prompt: teaching.learningLanguageString,
          skillTags,
        };
      });
  }
}
