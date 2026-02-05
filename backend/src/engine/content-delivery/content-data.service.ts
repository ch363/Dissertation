import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliveryCandidate } from './types';
import { CandidateService } from './candidate.service';
import { LoggerService } from '../../common/logger';

/**
 * ContentDataService
 * 
 * Retrieves teaching and question data from the database.
 * Follows Single Responsibility Principle - focused on content data retrieval.
 */
@Injectable()
export class ContentDataService {
  private readonly logger = new LoggerService(ContentDataService.name);

  constructor(
    private prisma: PrismaService,
    private candidateService: CandidateService,
  ) {}

  /**
   * Get teaching data by ID.
   */
  async getTeachingData(teachingId: string) {
    return this.prisma.teaching.findUnique({
      where: { id: teachingId },
      include: {
        skillTags: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get question data by ID.
   */
  async getQuestionData(questionId: string) {
    return this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        teaching: {
          include: {
            skillTags: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
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

    const whereClause: any = {
      id: { in: Array.from(teachingIds) },
    };

    if (lessonId) {
      whereClause.lessonId = lessonId;
    } else if (moduleId) {
      whereClause.lesson = { moduleId };
    }

    const teachings = await this.prisma.teaching.findMany({
      where: whereClause,
      include: {
        lesson: true,
        skillTags: {
          select: {
            name: true,
          },
        },
      },
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
