import { Injectable } from '@nestjs/common';
import { DELIVERY_METHOD } from '@prisma/client';
import { DeliveryCandidate } from './types';
import { DifficultyCalculator } from './difficulty-calculator.service';
import { CandidateRepository, QuestionWithDetails } from './candidate.repository';
import { determineExerciseType } from './session.config';

export interface CandidateOptions {
  lessonId?: string;
  moduleId?: string;
  prioritizedSkills?: string[];
}

/**
 * CandidateService
 * 
 * Selects and ranks learning candidates (review and new items).
 * 
 * DIP Compliance: Uses CandidateRepository for data access instead of direct Prisma.
 */
@Injectable()
export class CandidateService {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly difficultyCalculator: DifficultyCalculator,
  ) {}

  /**
   * Returns review candidates where "due" means: the *latest* performance row
   * per question (by createdAt) has nextReviewDue <= now. This matches
   * ProgressService.getDueReviewsLatest so that when the user completes a
   * review we create a new row with a future nextReviewDue and that question
   * correctly disappears from the due list.
   * 
   * Uses CandidateRepository for DIP compliance.
   */
  async getReviewCandidates(
    userId: string,
    options: CandidateOptions = {},
  ): Promise<DeliveryCandidate[]> {
    const { lessonId, moduleId } = options;
    const now = new Date();
    const candidates: DeliveryCandidate[] = [];

    // Get question IDs filter using repository
    let questionIdsFilter: string[] | undefined;
    if (lessonId) {
      questionIdsFilter = await this.candidateRepository.findQuestionIdsByLesson(lessonId);
      if (questionIdsFilter.length === 0) {
        return [];
      }
    } else if (moduleId) {
      questionIdsFilter = await this.candidateRepository.findQuestionIdsByModule(moduleId);
      if (questionIdsFilter.length === 0) {
        return [];
      }
    }

    // Get performances using repository (handles schema mismatch gracefully)
    const allPerformances = await this.candidateRepository.findPerformancesByUserWithFilter(
      userId,
      questionIdsFilter,
    );

    if (allPerformances.length === 0) {
      return [];
    }

    // Keep only the latest performance row per question (already ordered by createdAt desc)
    const questionIdMap = new Map<string, (typeof allPerformances)[0]>();
    for (const perf of allPerformances) {
      if (!questionIdMap.has(perf.questionId)) {
        questionIdMap.set(perf.questionId, perf);
      }
    }

    // Include only questions whose *latest* row is due (nextReviewDue <= now)
    const dueLatestPerformances = Array.from(questionIdMap.values()).filter(
      (perf) =>
        perf.nextReviewDue != null &&
        perf.nextReviewDue.getTime() <= now.getTime(),
    );

    // Build candidates using repository for question details
    for (const perf of dueLatestPerformances) {
      const question = await this.candidateRepository.findQuestionWithDetails(perf.questionId);

      if (question) {
        const candidate = await this.buildReviewCandidate(
          userId,
          question,
          perf,
          now,
        );
        candidates.push(candidate);
      }
    }

    return candidates;
  }

  /**
   * Build a review candidate from question and performance data.
   */
  private async buildReviewCandidate(
    userId: string,
    question: QuestionWithDetails,
    perf: { nextReviewDue: Date | null; questionId: string },
    now: Date,
  ): Promise<DeliveryCandidate> {
    const availableMethods: DELIVERY_METHOD[] =
      question.variants?.map((v) => v.deliveryMethod) ?? [];

    // Get recent attempts using repository
    const recentAttempts = await this.candidateRepository.findRecentAttempts(
      userId,
      perf.questionId,
      5,
    );

    const errorScore = recentAttempts.filter((a) => a.score < 80).length;
    const lastSeen = recentAttempts[0]?.createdAt || perf.nextReviewDue || now;
    const timeSinceLastSeen = Date.now() - lastSeen.getTime();
    const dueScore = this.calculateDueScore(perf.nextReviewDue || now, now);

    const recentScores = recentAttempts.map((a) => a.score);
    const avgScore =
      recentScores.length > 0
        ? recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length
        : 50;
    const estimatedMastery = avgScore / 100;

    const questionTags = this.extractSkillTags(question);
    const teachingTags = this.extractSkillTags(question.teaching);
    const skillTags = Array.from(new Set([...questionTags, ...teachingTags]));

    const exerciseType = determineExerciseType(availableMethods, question.teaching);

    const baseDifficulty = this.difficultyCalculator.calculateBaseDifficulty(
      question.teaching.knowledgeLevel,
    );
    const difficulty = this.difficultyCalculator.adjustDifficultyForMastery(
      baseDifficulty,
      estimatedMastery,
    );

    return {
      kind: 'question',
      id: question.id,
      questionId: question.id,
      teachingId: question.teachingId,
      lessonId: question.teaching.lessonId,
      dueScore,
      errorScore,
      timeSinceLastSeen,
      deliveryMethods: availableMethods,
      skillTags,
      exerciseType,
      difficulty,
      estimatedMastery,
    };
  }

  /**
   * Get new (unattempted) candidates for a user.
   * Uses CandidateRepository for DIP compliance.
   */
  async getNewCandidates(
    userId: string,
    options: CandidateOptions = {},
  ): Promise<DeliveryCandidate[]> {
    const { lessonId, moduleId } = options;

    // Use repository to find new (unattempted) questions
    const newQuestions = await this.candidateRepository.findNewQuestions(userId, {
      lessonId,
      moduleId,
    });

    // Build candidates from new questions
    return newQuestions.map((question) => this.buildNewCandidate(question));
  }

  /**
   * Build a new candidate from question data.
   */
  private buildNewCandidate(question: QuestionWithDetails): DeliveryCandidate {
    const questionTags = this.extractSkillTags(question);
    const teachingTags = this.extractSkillTags(question.teaching);
    const skillTags = Array.from(new Set([...questionTags, ...teachingTags]));

    const availableMethods: DELIVERY_METHOD[] =
      question.variants?.map((v) => v.deliveryMethod) ?? [];

    const exerciseType = determineExerciseType(availableMethods, question.teaching);

    const difficulty = this.difficultyCalculator.calculateBaseDifficulty(
      question.teaching.knowledgeLevel,
    );

    return {
      kind: 'question',
      id: question.id,
      questionId: question.id,
      teachingId: question.teachingId,
      lessonId: question.teaching.lessonId,
      dueScore: 0,
      errorScore: 0,
      timeSinceLastSeen: Infinity,
      deliveryMethods: availableMethods,
      skillTags,
      exerciseType,
      difficulty,
      estimatedMastery: 0,
    };
  }

  extractSkillTags(item: { skillTags?: Array<{ name: string }> }): string[] {
    if (item.skillTags && Array.isArray(item.skillTags)) {
      return item.skillTags.map((tag) => tag.name).filter((name) => name);
    }
    return [];
  }

  private calculateDueScore(dueAt: Date, now: Date): number {
    const overdueMs = now.getTime() - dueAt.getTime();
    return Math.max(0, overdueMs / (1000 * 60 * 60));
  }
}
