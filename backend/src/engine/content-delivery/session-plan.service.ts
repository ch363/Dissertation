/**
 * Session Plan Service
 * 
 * This service generates complete learning session plans with structured steps.
 * Supports teach-then-test, interleaving, adaptive modality, and time-based pacing.
 * 
 * This is a SERVICE LAYER, not middleware. It's called by ContentDeliveryService
 * to generate session plans. It does NOT handle HTTP requests directly.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentLookupService } from '../../content/content-lookup.service';
import { DELIVERY_METHOD } from '@prisma/client';
import {
  SessionPlanDto,
  SessionContext,
  SessionStep,
  StepItem,
  TeachStepItem,
  PracticeStepItem,
  RecapStepItem,
  SessionMetadata,
  UserTimeAverages,
} from './session-types';
import { DeliveryCandidate } from './types';
import {
  calculateItemCount,
  interleaveItems,
  selectModality,
  groupByTopic,
  estimateTime,
  planTeachThenTest,
  getDefaultTimeAverages,
  mixByDeliveryMethod,
} from './session-planning.policy';
import { rankCandidates, composeWithInterleaving } from './selection.policy';

@Injectable()
export class SessionPlanService {
  constructor(
    private prisma: PrismaService,
    private contentLookup: ContentLookupService,
  ) {}

  /**
   * Create a complete session plan for the user.
   * 
   * This method respects previous progress by:
   * - Using context.lessonId to filter content to a specific lesson (when provided)
   * - Querying UserTeachingCompleted to get seenTeachingIds and exclude already-completed teachings
   * - Filtering teaching candidates early to avoid re-showing content the user has already learned
   * 
   * @param userId User ID
   * @param context Session context (mode, time budget, lesson, theme)
   *   - lessonId: When provided, filters candidates to this specific lesson
   *   - seenTeachingIds: Used to exclude teachings from UserTeachingCompleted table
   * @returns Complete session plan with ordered steps
   */
  async createPlan(userId: string, context: SessionContext): Promise<SessionPlanDto> {
    const now = new Date();
    const sessionId = `session-${userId}-${Date.now()}`;

    // 1. Get user's time averages for adaptive estimation
    const userTimeAverages = await this.getUserAverageTimes(userId);

    // 2. Calculate target item count from time budget
    const avgTimePerItem =
      (userTimeAverages.avgTimePerTeachSec + userTimeAverages.avgTimePerPracticeSec) / 2;
    const targetItemCount = context.timeBudgetSec
      ? calculateItemCount(context.timeBudgetSec, avgTimePerItem)
      : 15; // Default: 15 items

    // 3. Get seen teaching IDs to filter out already-completed teachings
    // This queries UserTeachingCompleted to exclude teachings the user has already seen
    // Note: This gets ALL seen teachings (not lesson-specific) to prevent re-showing
    // content the user has already learned, even if it appears in a different lesson context
    const seenTeachingIds = await this.getSeenTeachingIds(userId);

    // 4. Gather candidates
    const reviewCandidates = await this.getReviewCandidates(userId, context.lessonId);
    const newCandidates = await this.getNewCandidates(userId, context.lessonId);
    const teachingCandidates = await this.getTeachingCandidates(
      userId,
      newCandidates,
      seenTeachingIds,
      context.lessonId,
    );

    // 4. Filter by mode
    let selectedCandidates: DeliveryCandidate[] = [];
    if (context.mode === 'review') {
      selectedCandidates = reviewCandidates;
    } else if (context.mode === 'learn') {
      // For learn mode, prioritize new items but include reviews if there aren't enough new items
      const rankedNew = rankCandidates(newCandidates);
      const rankedReviews = rankCandidates(reviewCandidates);
      
      // If we have enough new items, use only new items
      if (rankedNew.length >= targetItemCount) {
        selectedCandidates = rankedNew;
      } else {
        // Not enough new items: fill with reviews to meet target
        const newCount = rankedNew.length;
        const reviewCount = targetItemCount - newCount;
        selectedCandidates = [
          ...rankedNew,
          ...rankedReviews.slice(0, reviewCount),
        ];
      }
    } else {
      // mixed: combine reviews and new
      const rankedReviews = rankCandidates(reviewCandidates);
      const rankedNew = rankCandidates(newCandidates);
      // Mix 70% reviews, 30% new
      const reviewCount = Math.floor(targetItemCount * 0.7);
      const newCount = targetItemCount - reviewCount;
      selectedCandidates = [
        ...rankedReviews.slice(0, reviewCount),
        ...rankedNew.slice(0, newCount),
      ];
    }

    // Limit to target count
    selectedCandidates = selectedCandidates.slice(0, targetItemCount);

    // 5. Apply teach-then-test (for new content only)
    // Note: seenTeachingIds was already retrieved earlier (step 3) to filter teaching candidates
    // It's reused here for planTeachThenTest() which also filters out seen teachings
    const newQuestions = selectedCandidates.filter((c) => c.kind === 'question' && c.dueScore === 0);
    const reviews = selectedCandidates.filter((c) => c.dueScore > 0);

    let finalCandidates: DeliveryCandidate[] = [];
    if (context.mode === 'learn' || context.mode === 'mixed') {
      // Apply teach-then-test to new questions
      // Note: teachingCandidates have already been filtered by seenTeachingIds in getTeachingCandidates()
      // planTeachThenTest() also uses seenTeachingIds as a safeguard to ensure no seen teachings slip through
      const teachingsForNew = teachingCandidates.filter((t) =>
        newQuestions.some((q) => q.teachingId === t.teachingId),
      );
      const teachThenTestSequence = planTeachThenTest(
        teachingsForNew,
        newQuestions,
        seenTeachingIds, // Used to exclude teachings from UserTeachingCompleted
      );
      
      // For learn mode, prioritize teach-then-test pairs
      // Group teach-then-test pairs together to preserve them during interleaving
      const teachTestPairs: DeliveryCandidate[][] = [];
      const standaloneItems: DeliveryCandidate[] = [];
      
      for (let i = 0; i < teachThenTestSequence.length; i++) {
        const item = teachThenTestSequence[i];
        if (item.kind === 'teaching' && i + 1 < teachThenTestSequence.length) {
          const nextItem = teachThenTestSequence[i + 1];
          if (nextItem.kind === 'question' && nextItem.teachingId === item.teachingId) {
            // Found a teach-then-test pair
            teachTestPairs.push([item, nextItem]);
            i++; // Skip the question as it's already in the pair
            continue;
          }
        }
        standaloneItems.push(item);
      }
      
      // Interleave the pairs and standalone items, but keep pairs together
      // For now, just use the teach-then-test sequence directly to ensure pairs stay together
      // We'll apply light interleaving only to reviews
      if (reviews.length > 0) {
        const interleavedReviews = composeWithInterleaving(reviews, {
          maxSameTypeInRow: 2,
          requireModalityCoverage: false, // Don't require coverage for reviews
          enableScaffolding: false,
          consecutiveErrors: 0,
        });
        // Interleave reviews with teach-then-test pairs, but keep pairs intact
        finalCandidates = this.interleaveWithPairs(interleavedReviews, teachThenTestSequence);
      } else {
        finalCandidates = teachThenTestSequence;
      }
    } else {
      // Review mode: apply interleaving normally
      finalCandidates = composeWithInterleaving(selectedCandidates, {
        maxSameTypeInRow: 2,
        requireModalityCoverage: true,
        enableScaffolding: true,
        consecutiveErrors: 0,
      });
    }

    // 7. Get user preferences for modality selection
    const userPreferences = await this.getDeliveryMethodScores(userId);

    // 8. Build steps
    const steps: SessionStep[] = [];
    let stepNumber = 1;
    const recentMethods: DELIVERY_METHOD[] = [];

    for (const candidate of finalCandidates) {
      if (candidate.kind === 'teaching') {
        const teaching = await this.getTeachingData(candidate.id);
        if (teaching) {
          const stepItem: TeachStepItem = {
            type: 'teach',
            teachingId: teaching.id,
            lessonId: teaching.lessonId,
            phrase: teaching.learningLanguageString,
            translation: teaching.userLanguageString,
            emoji: teaching.emoji || undefined,
            tip: teaching.tip || undefined,
            knowledgeLevel: teaching.knowledgeLevel,
          };

          const estimatedTime = estimateTime(candidate, userTimeAverages);

          steps.push({
            stepNumber: stepNumber++,
            type: 'teach',
            item: stepItem,
            estimatedTimeSec: estimatedTime,
          });
        }
      } else if (candidate.kind === 'question') {
        const question = await this.getQuestionData(candidate.id);
        if (question && candidate.deliveryMethods && candidate.deliveryMethods.length > 0) {
          // Select delivery method
          const selectedMethod = selectModality(
            candidate,
            candidate.deliveryMethods,
            userPreferences,
            {
              recentMethods,
              avoidRepetition: true,
            },
          );

          if (selectedMethod) {
            recentMethods.push(selectedMethod);
            if (recentMethods.length > 5) {
              recentMethods.shift(); // Keep only last 5
            }

            const stepItem = await this.buildPracticeStepItem(
              question,
              selectedMethod,
              candidate.teachingId || '',
              candidate.lessonId || '',
            );

            const estimatedTime = estimateTime(candidate, userTimeAverages, selectedMethod);

            steps.push({
              stepNumber: stepNumber++,
              type: 'practice',
              item: stepItem,
              estimatedTimeSec: estimatedTime,
              deliveryMethod: selectedMethod,
            });
          }
        }
      }
    }

    // 9. Add recap step
    const totalEstimatedTime = steps.reduce((sum, step) => sum + step.estimatedTimeSec, 0);
    const potentialXp = steps.filter((s) => s.type === 'practice').length * 15; // ~15 XP per practice

    const recapItem: RecapStepItem = {
      type: 'recap',
      summary: {
        totalItems: steps.length,
        correctCount: 0, // Will be updated after session
        accuracy: 0, // Will be updated after session
        timeSpentSec: 0, // Will be updated after session
        xpEarned: potentialXp,
        streakDays: undefined, // Can be fetched from user
        badgesEarned: undefined, // Can be calculated
      },
    };

    steps.push({
      stepNumber: stepNumber,
      type: 'recap',
      item: recapItem,
      estimatedTimeSec: 10, // 10 seconds for recap
    });

    // 10. Build metadata
    const metadata: SessionMetadata = {
      totalEstimatedTimeSec: totalEstimatedTime + 10, // Include recap
      totalSteps: steps.length,
      teachSteps: steps.filter((s) => s.type === 'teach').length,
      practiceSteps: steps.filter((s) => s.type === 'practice').length,
      recapSteps: 1,
      potentialXp,
      dueReviewsIncluded: reviewCandidates.length,
      newItemsIncluded: newCandidates.length,
      topicsCovered: Array.from(
        new Set(finalCandidates.map((c) => c.teachingId || c.lessonId || '').filter(Boolean)),
      ),
      deliveryMethodsUsed: Array.from(new Set(recentMethods)),
    };

    return {
      id: sessionId,
      kind: context.mode === 'review' ? 'review' : context.mode === 'learn' ? 'learn' : 'mixed',
      lessonId: context.lessonId,
      title: this.buildTitle(context),
      steps,
      metadata,
      createdAt: now,
    };
  }

  /**
   * Get user's average times per item type from history.
   */
  private async getUserAverageTimes(userId: string): Promise<UserTimeAverages> {
    // Get all user performances
    // If column doesn't exist (migration not run), return defaults
    let performances;
    try {
      performances = await this.prisma.userQuestionPerformance.findMany({
        where: { userId },
        select: {
          timeToComplete: true,
          question: {
            select: {
              type: true,
            },
          },
        },
        take: 100, // Sample last 100 for performance
      });
    } catch (error: any) {
      // If column doesn't exist or other database schema error, return defaults
      if (
        error?.message?.includes('column') ||
        error?.message?.includes('does not exist') ||
        error?.message?.includes('not available')
      ) {
        return getDefaultTimeAverages();
      }
      throw error; // Re-throw if it's a different error
    }

    // Calculate averages by delivery method
    const methodTimes = new Map<DELIVERY_METHOD, number[]>();
    const allPracticeTimes: number[] = [];

    for (const perf of performances) {
      if (perf.timeToComplete) {
        allPracticeTimes.push(perf.timeToComplete / 1000); // Convert ms to seconds

        // Group by delivery method
        const deliveryMethod = perf.question.type;
        if (!methodTimes.has(deliveryMethod)) {
          methodTimes.set(deliveryMethod, []);
        }
        methodTimes.get(deliveryMethod)!.push(perf.timeToComplete / 1000);
      }
    }

    // Calculate averages
    const avgByMethod = new Map<DELIVERY_METHOD, number>();
    for (const [method, times] of Array.from(methodTimes.entries())) {
      const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
      avgByMethod.set(method, avg);
    }

    const avgPracticeTime =
      allPracticeTimes.length > 0
        ? allPracticeTimes.reduce((sum, t) => sum + t, 0) / allPracticeTimes.length
        : 60;

    // Use defaults if no data, otherwise merge with defaults
    const defaults = getDefaultTimeAverages();
    return {
      avgTimePerTeachSec: defaults.avgTimePerTeachSec,
      avgTimePerPracticeSec: avgPracticeTime || defaults.avgTimePerPracticeSec,
      avgTimeByDeliveryMethod: avgByMethod.size > 0 ? avgByMethod : defaults.avgTimeByDeliveryMethod,
      avgTimeByQuestionType: defaults.avgTimeByQuestionType,
    };
  }

  /**
   * Get review candidates (due items).
   */
  private async getReviewCandidates(
    userId: string,
    lessonId?: string,
  ): Promise<DeliveryCandidate[]> {
    const now = new Date();
    const candidates: DeliveryCandidate[] = [];

    const questionWhere: any = {
      userId,
      nextReviewDue: {
        lte: now,
        not: null,
      },
    };

    if (lessonId) {
      const lessonQuestions = await this.prisma.question.findMany({
        where: {
          teaching: { lessonId },
        },
        select: { id: true },
      });
      const questionIds = lessonQuestions.map((q) => q.id);
      // If no questions in lesson, return empty array early to avoid Prisma query error
      if (questionIds.length === 0) {
        return [];
      }
      questionWhere.questionId = { in: questionIds };
    }

    // Query for due review performances
    // If column doesn't exist (migration not run), catch and return empty array
    let allDuePerformances;
    try {
      allDuePerformances = await this.prisma.userQuestionPerformance.findMany({
        where: questionWhere,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      // If column doesn't exist or other database schema error, return empty array
      // This handles the case where migrations haven't been run yet or database is empty
      if (
        error?.message?.includes('column') ||
        error?.message?.includes('does not exist') ||
        error?.message?.includes('not available')
      ) {
        return [];
      }
      throw error; // Re-throw if it's a different error
    }

    const questionIdMap = new Map<string, typeof allDuePerformances[0]>();
    for (const perf of allDuePerformances) {
      const existing = questionIdMap.get(perf.questionId);
      if (!existing || perf.createdAt > existing.createdAt) {
        questionIdMap.set(perf.questionId, perf);
      }
    }

    for (const perf of Array.from(questionIdMap.values())) {
      const question = await this.prisma.question.findUnique({
        where: { id: perf.questionId },
        include: {
          teaching: {
            include: {
              lesson: true,
            },
          },
        },
      });

      if (question) {
        const recentAttempts = await this.prisma.userQuestionPerformance.findMany({
          where: {
            userId,
            questionId: perf.questionId,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        const errorScore = recentAttempts.filter((a) => a.score < 80).length;
        const lastSeen = recentAttempts[0]?.createdAt || perf.nextReviewDue || now;
        const timeSinceLastSeen = Date.now() - lastSeen.getTime();
        const overdueMs = now.getTime() - (perf.nextReviewDue || now).getTime();
        const dueScore = Math.max(0, overdueMs / (1000 * 60 * 60));

        // Calculate estimated mastery from recent performance
        const recentScores = recentAttempts.map((a) => a.score);
        const avgScore = recentScores.length > 0
          ? recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length
          : 50;
        const estimatedMastery = avgScore / 100; // Convert 0-100 to 0-1

        // Extract skill tags from teaching (could be enhanced with actual skill table)
        const skillTags = this.extractSkillTags(question.teaching);

        // Determine exercise type from delivery method and teaching content
        const exerciseType = this.determineExerciseType(
          [question.type],
          question.teaching,
        );

        // Estimate difficulty (0 = easy, 1 = hard)
        // Based on knowledge level and mastery
        const knowledgeLevelDifficulty: Record<string, number> = {
          A1: 0.1,
          A2: 0.3,
          B1: 0.5,
          B2: 0.7,
          C1: 0.85,
          C2: 1.0,
        };
        const baseDifficulty = knowledgeLevelDifficulty[question.teaching.knowledgeLevel] || 0.5;
        // Adjust based on user's mastery (lower mastery = higher effective difficulty)
        const difficulty = baseDifficulty * (1 - estimatedMastery * 0.3); // Cap adjustment at 30%

        candidates.push({
          kind: 'question',
          id: question.id,
          questionId: question.id,
          teachingId: question.teachingId,
          lessonId: question.teaching.lessonId,
          dueScore,
          errorScore,
          timeSinceLastSeen,
          deliveryMethods: [question.type],
          skillTags,
          exerciseType,
          difficulty,
          estimatedMastery,
        });
      }
    }

    return candidates;
  }

  /**
   * Get new candidates (not yet seen).
   */
  private async getNewCandidates(
    userId: string,
    lessonId?: string,
  ): Promise<DeliveryCandidate[]> {
    const candidates: DeliveryCandidate[] = [];

    const whereClause: any = {};
    if (lessonId) {
      whereClause.teaching = { lessonId };
    }

    const allQuestions = await this.prisma.question.findMany({
      where: whereClause,
      include: {
        teaching: {
          include: {
            lesson: true,
          },
        },
      },
    });

    const attemptedQuestionIds = await this.prisma.userQuestionPerformance.findMany({
      where: { userId },
      select: { questionId: true },
      distinct: ['questionId'],
    });
    const attemptedSet = new Set(attemptedQuestionIds.map((a) => a.questionId));

    for (const question of allQuestions) {
      if (!attemptedSet.has(question.id)) {
        // For new items, estimate mastery as 0 (not yet attempted)
        const estimatedMastery = 0;

        // Extract skill tags from teaching
        const skillTags = this.extractSkillTags(question.teaching);

        // Determine exercise type
        const exerciseType = this.determineExerciseType(
          [question.type],
          question.teaching,
        );

        // Estimate difficulty from knowledge level
        const knowledgeLevelDifficulty: Record<string, number> = {
          A1: 0.1,
          A2: 0.3,
          B1: 0.5,
          B2: 0.7,
          C1: 0.85,
          C2: 1.0,
        };
        const difficulty = knowledgeLevelDifficulty[question.teaching.knowledgeLevel] || 0.5;

        candidates.push({
          kind: 'question',
          id: question.id,
          questionId: question.id,
          teachingId: question.teachingId,
          lessonId: question.teaching.lessonId,
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: Infinity,
          deliveryMethods: [question.type],
          skillTags,
          exerciseType,
          difficulty,
          estimatedMastery,
        });
      }
    }

    return candidates;
  }

  /**
   * Extract skill tags from teaching content.
   * This is a simple heuristic - can be enhanced with actual skill table later.
   */
  private extractSkillTags(teaching: any): string[] {
    const tags: string[] = [];

    // Extract from tip if available
    if (teaching.tip) {
      // Simple keyword extraction (can be enhanced)
      const tipLower = teaching.tip.toLowerCase();
      if (tipLower.includes('greeting') || tipLower.includes('hello')) {
        tags.push('greetings');
      }
      if (tipLower.includes('number') || tipLower.includes('count')) {
        tags.push('numbers');
      }
      if (tipLower.includes('verb') || tipLower.includes('essere') || tipLower.includes('avere')) {
        tags.push('verbs');
      }
      if (tipLower.includes('article') || tipLower.includes('masculine') || tipLower.includes('feminine')) {
        tags.push('articles');
      }
    }

    // Use lesson title as a skill tag
    if (teaching.lesson?.title) {
      const lessonTitle = teaching.lesson.title.toLowerCase();
      // Extract key words from lesson title
      const words = lessonTitle.split(/\s+/);
      tags.push(...words.slice(0, 2)); // Take first 2 words as tags
    }

    return Array.from(new Set(tags)); // Deduplicate
  }

  /**
   * Determine exercise type from delivery methods and teaching content.
   */
  private determineExerciseType(
    deliveryMethods: DELIVERY_METHOD[],
    teaching: any,
  ): string {
    // Check delivery methods first
    if (deliveryMethods.includes(DELIVERY_METHOD.SPEECH_TO_TEXT) ||
        deliveryMethods.includes(DELIVERY_METHOD.TEXT_TO_SPEECH)) {
      return 'speaking';
    }
    if (deliveryMethods.includes(DELIVERY_METHOD.TEXT_TRANSLATION)) {
      return 'translation';
    }
    if (deliveryMethods.includes(DELIVERY_METHOD.FILL_BLANK)) {
      return 'grammar';
    }
    if (deliveryMethods.includes(DELIVERY_METHOD.MULTIPLE_CHOICE)) {
      return 'vocabulary';
    }
    if (deliveryMethods.includes(DELIVERY_METHOD.FLASHCARD)) {
      return 'vocabulary';
    }

    // Fallback: infer from teaching content
    if (teaching.tip) {
      const tipLower = teaching.tip.toLowerCase();
      if (tipLower.includes('grammar') || tipLower.includes('rule')) {
        return 'grammar';
      }
      if (tipLower.includes('vocabulary') || tipLower.includes('word')) {
        return 'vocabulary';
      }
    }

    return 'practice'; // Default
  }

  /**
   * Get teaching candidates for teach-then-test.
   * Filters out teachings that have already been completed by the user.
   * @param userId User ID
   * @param questionCandidates Question candidates to get teachings for
   * @param seenTeachingIds Set of teaching IDs the user has already completed (from UserTeachingCompleted)
   * @param lessonId Optional lesson ID to filter teachings by lesson
   * @returns Teaching candidates that haven't been seen yet
   */
  private async getTeachingCandidates(
    userId: string,
    questionCandidates: DeliveryCandidate[],
    seenTeachingIds: Set<string>,
    lessonId?: string,
  ): Promise<DeliveryCandidate[]> {
    const teachingIds = new Set(
      questionCandidates.map((c) => c.teachingId).filter((id): id is string => !!id),
    );

    if (teachingIds.size === 0) {
      return [];
    }

    const whereClause: any = {
      id: { in: Array.from(teachingIds) },
    };

    if (lessonId) {
      whereClause.lessonId = lessonId;
    }

    const teachings = await this.prisma.teaching.findMany({
      where: whereClause,
      include: {
        lesson: true,
      },
    });

    // Filter out teachings that have already been completed by the user
    // This ensures we don't re-show content the user has already learned
    return teachings
      .filter((teaching) => !seenTeachingIds.has(teaching.id))
      .map((teaching) => ({
        kind: 'teaching' as const,
        id: teaching.id,
        teachingId: teaching.id,
        lessonId: teaching.lessonId,
        dueScore: 0,
        errorScore: 0,
        timeSinceLastSeen: Infinity,
        title: teaching.userLanguageString,
        prompt: teaching.learningLanguageString,
      }));
  }

  /**
   * Get teaching data by ID.
   */
  private async getTeachingData(teachingId: string) {
    return this.prisma.teaching.findUnique({
      where: { id: teachingId },
      select: {
        id: true,
        lessonId: true,
        userLanguageString: true,
        learningLanguageString: true,
        emoji: true,
        tip: true,
        knowledgeLevel: true,
      },
    });
  }

  /**
   * Get question data by ID.
   */
  private async getQuestionData(questionId: string) {
    return this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        teaching: {
          select: {
            id: true,
            userLanguageString: true,
            learningLanguageString: true,
          },
        },
      },
    });
  }

  /**
   * Build practice step item from question data.
   */
  private async buildPracticeStepItem(
    question: Awaited<ReturnType<typeof this.getQuestionData>>,
    deliveryMethod: DELIVERY_METHOD,
    teachingId: string,
    lessonId: string,
  ): Promise<PracticeStepItem> {
    if (!question) {
      throw new Error('Question data is required');
    }

    const baseItem: PracticeStepItem = {
      type: 'practice',
      questionId: question.id,
      teachingId,
      lessonId,
      deliveryMethod,
    };

    // Use teaching data as fallback prompt
    if (question.teaching) {
      baseItem.prompt = question.teaching.learningLanguageString;
    }

    // Load question-specific data from Teaching relationship
    try {
      const questionData = await this.contentLookup.getQuestionData(question.id, lessonId, deliveryMethod);
      if (questionData) {
        // Override prompt if available
        if (questionData.prompt) {
          baseItem.prompt = questionData.prompt;
        }

        // Populate delivery method specific fields
        if (deliveryMethod === DELIVERY_METHOD.MULTIPLE_CHOICE) {
          baseItem.options = questionData.options;
          baseItem.correctOptionId = questionData.correctOptionId;
          baseItem.sourceText = questionData.sourceText; // For translation MCQ
        } else if (deliveryMethod === DELIVERY_METHOD.FILL_BLANK) {
          baseItem.text = questionData.text;
          baseItem.answer = questionData.answer;
          baseItem.hint = questionData.hint;
          // Add options for tap-to-fill if available
          if (questionData.options && questionData.options.length > 0) {
            baseItem.options = questionData.options;
          }
        } else if (deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION) {
          baseItem.source = questionData.source;
          baseItem.answer = questionData.answer;
          baseItem.hint = questionData.hint;
        } else if (deliveryMethod === DELIVERY_METHOD.FLASHCARD) {
          // FLASHCARD uses the same structure as TEXT_TRANSLATION (source/answer)
          baseItem.source = questionData.source;
          baseItem.answer = questionData.answer;
          baseItem.hint = questionData.hint;
        } else if (
          deliveryMethod === DELIVERY_METHOD.SPEECH_TO_TEXT ||
          deliveryMethod === DELIVERY_METHOD.TEXT_TO_SPEECH
        ) {
          baseItem.answer = questionData.answer;
          // For TEXT_TO_SPEECH, include translation for UI display
          if (deliveryMethod === DELIVERY_METHOD.TEXT_TO_SPEECH && question.teaching) {
            baseItem.translation = question.teaching.userLanguageString;
          }
        }
      }
    } catch (error) {
      // If content lookup fails, log detailed error and continue with basic item
      console.error(`Failed to load question data for ${question.id}:`, error);
      // Log the error details for debugging
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      // For MULTIPLE_CHOICE, if options generation fails, log it specifically
      if (deliveryMethod === DELIVERY_METHOD.MULTIPLE_CHOICE) {
        console.error(`MULTIPLE_CHOICE question ${question.id} failed to generate options. Teaching ID: ${question.teachingId}, Lesson ID: ${lessonId}`);
      }
    }

    return baseItem;
  }

  /**
   * Get seen teaching IDs for user.
   * 
   * Queries the UserTeachingCompleted table to get all teachings the user has already completed.
   * This is used to filter out teachings from session plans, ensuring users don't see content
   * they've already learned.
   * 
   * Note: This returns ALL seen teachings across all lessons (not lesson-specific).
   * This is intentional - we want to prevent re-showing content the user has already learned,
   * even if it appears in a different lesson context.
   * 
   * @param userId User ID
   * @returns Set of teaching IDs that have been completed by the user
   */
  private async getSeenTeachingIds(userId: string): Promise<Set<string>> {
    const completed = await this.prisma.userTeachingCompleted.findMany({
      where: { userId },
      select: { teachingId: true },
    });
    return new Set(completed.map((c) => c.teachingId));
  }

  /**
   * Interleave reviews with teach-then-test pairs while preserving pair integrity.
   * This ensures teachings always appear directly before their questions.
   */
  private interleaveWithPairs(
    reviews: DeliveryCandidate[],
    teachTestSequence: DeliveryCandidate[],
  ): DeliveryCandidate[] {
    const result: DeliveryCandidate[] = [];
    let reviewIndex = 0;
    let teachTestIndex = 0;
    
    // Group teach-test sequence into pairs
    const pairs: DeliveryCandidate[][] = [];
    for (let i = 0; i < teachTestSequence.length; i++) {
      const item = teachTestSequence[i];
      if (item.kind === 'teaching' && i + 1 < teachTestSequence.length) {
        const nextItem = teachTestSequence[i + 1];
        if (nextItem.kind === 'question' && nextItem.teachingId === item.teachingId) {
          pairs.push([item, nextItem]);
          i++; // Skip next item as it's in the pair
          continue;
        }
      }
      // Standalone item (shouldn't happen in learn mode, but handle it)
      pairs.push([item]);
    }
    
    // Interleave: add a pair, then a review, then a pair, etc.
    let pairIndex = 0;
    while (pairIndex < pairs.length || reviewIndex < reviews.length) {
      // Add a teach-test pair if available
      if (pairIndex < pairs.length) {
        result.push(...pairs[pairIndex]);
        pairIndex++;
      }
      // Add a review if available
      if (reviewIndex < reviews.length) {
        result.push(reviews[reviewIndex]);
        reviewIndex++;
      }
    }
    
    return result;
  }

  /**
   * Get delivery method scores for user.
   */
  private async getDeliveryMethodScores(
    userId: string,
  ): Promise<Map<DELIVERY_METHOD, number>> {
    const scores = await this.prisma.userDeliveryMethodScore.findMany({
      where: { userId },
    });

    const map = new Map<DELIVERY_METHOD, number>();
    scores.forEach((s) => {
      map.set(s.deliveryMethod, s.score);
    });

    return map;
  }

  /**
   * Build session title from context.
   */
  private buildTitle(context: SessionContext): string {
    if (context.lessonId) {
      return 'Lesson Session';
    }
    if (context.mode === 'review') {
      return 'Review Session';
    }
    if (context.mode === 'learn') {
      return 'Learning Session';
    }
    return 'Practice Session';
  }
}
