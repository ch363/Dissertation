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
  composeWithInterleaving,
  estimateTime,
  getDefaultTimeAverages,
  planTeachThenTest,
  rankCandidates,
  selectModality,
} from './content-delivery.policy';
import { MasteryService } from '../mastery/mastery.service';
import { OnboardingPreferencesService } from '../../onboarding/onboarding-preferences.service';
import { CandidateService } from './candidate.service';

@Injectable()
export class SessionPlanService {
  constructor(
    private prisma: PrismaService,
    private contentLookup: ContentLookupService,
    private masteryService: MasteryService,
    private onboardingPreferences: OnboardingPreferencesService,
    private candidateService: CandidateService,
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
  async createPlan(
    userId: string,
    context: SessionContext,
  ): Promise<SessionPlanDto> {
    const now = new Date();
    const sessionId = `session-${userId}-${Date.now()}`;

    // 0. Get onboarding preferences for personalization
    const onboardingPrefs =
      await this.onboardingPreferences.getOnboardingPreferences(userId);
    const challengeWeight = onboardingPrefs.challengeWeight;

    // Use onboarding sessionMinutes as default time budget if not provided
    let effectiveTimeBudgetSec = context.timeBudgetSec;
    if (!effectiveTimeBudgetSec && onboardingPrefs.sessionMinutes) {
      effectiveTimeBudgetSec = onboardingPrefs.sessionMinutes * 60;
    }

    // 1. Get user's time averages for adaptive estimation
    const userTimeAverages = await this.getUserAverageTimes(userId);

    // 2. Calculate target item count from time budget
    const avgTimePerItem =
      (userTimeAverages.avgTimePerTeachSec +
        userTimeAverages.avgTimePerPracticeSec) /
      2;
    const targetItemCount = effectiveTimeBudgetSec
      ? calculateItemCount(effectiveTimeBudgetSec, avgTimePerItem)
      : 15; // Default: 15 items

    // 3. Get seen teaching IDs to filter out already-completed teachings
    // This queries UserTeachingCompleted to exclude teachings the user has already seen
    // Note: This gets ALL seen teachings (not lesson-specific) to prevent re-showing
    // content the user has already learned, even if it appears in a different lesson context
    const seenTeachingIds = await this.getSeenTeachingIds(userId);

    // 3.5. Get low mastery skills to prioritize 'New' teachings
    const prioritizedSkills = await this.masteryService.getLowMasterySkills(
      userId,
      0.5,
    );

    // 4. Gather candidates
    const reviewCandidates = await this.candidateService.getReviewCandidates(
      userId,
      {
        lessonId: context.lessonId,
        moduleId: context.moduleId,
      },
    );
    const newCandidates = await this.candidateService.getNewCandidates(
      userId,
      {
        lessonId: context.lessonId,
        moduleId: context.moduleId,
        prioritizedSkills,
      },
    );

    // 4. Filter by mode
    let selectedCandidates: DeliveryCandidate[] = [];
    if (context.mode === 'review') {
      selectedCandidates = reviewCandidates;
    } else if (context.mode === 'learn') {
      // For learn mode, prioritize new items but include reviews if there aren't enough new items
      const rankedNew = rankCandidates(
        newCandidates,
        prioritizedSkills,
        challengeWeight,
      );
      const rankedReviews = rankCandidates(
        reviewCandidates,
        [],
        challengeWeight,
      );

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
      const rankedReviews = rankCandidates(
        reviewCandidates,
        [],
        challengeWeight,
      );
      const rankedNew = rankCandidates(
        newCandidates,
        prioritizedSkills,
        challengeWeight,
      );
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
    // Get teaching candidates for the FINAL selected questions (not all newCandidates)
    // This ensures teachings match the questions that will actually be shown
    const newQuestions = selectedCandidates.filter(
      (c) => c.kind === 'question' && c.dueScore === 0,
    );
    const reviews = selectedCandidates.filter((c) => c.dueScore > 0);

    // Create teaching candidates from the selected new questions (not all newCandidates)
    const teachingCandidates = await this.getTeachingCandidates(
      userId,
      newQuestions,
      seenTeachingIds,
      context.lessonId,
      context.moduleId,
    );

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
          if (
            nextItem.kind === 'question' &&
            nextItem.teachingId === item.teachingId
          ) {
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
        finalCandidates = this.interleaveWithPairs(
          interleavedReviews,
          teachThenTestSequence,
        );
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
            rationale: this.buildStepRationale(candidate, prioritizedSkills),
          });
        }
      } else if (candidate.kind === 'question') {
        const question = await this.getQuestionData(candidate.id);
        if (
          question &&
          candidate.deliveryMethods &&
          candidate.deliveryMethods.length > 0
        ) {
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

            const estimatedTime = estimateTime(
              candidate,
              userTimeAverages,
              selectedMethod,
            );

            steps.push({
              stepNumber: stepNumber++,
              type: 'practice',
              item: stepItem,
              estimatedTimeSec: estimatedTime,
              deliveryMethod: selectedMethod,
              rationale: this.buildStepRationale(candidate, prioritizedSkills),
            });
          }
        }
      }
    }

    // 9. Add recap step
    const totalEstimatedTime = steps.reduce(
      (sum, step) => sum + step.estimatedTimeSec,
      0,
    );
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
        new Set(
          finalCandidates
            .map((c) => c.teachingId || c.lessonId || '')
            .filter(Boolean),
        ),
      ),
      deliveryMethodsUsed: Array.from(new Set(recentMethods)),
    };

    return {
      id: sessionId,
      kind:
        context.mode === 'review'
          ? 'review'
          : context.mode === 'learn'
            ? 'learn'
            : 'mixed',
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
          deliveryMethod: true,
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
        const deliveryMethod = perf.deliveryMethod;
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
        ? allPracticeTimes.reduce((sum, t) => sum + t, 0) /
          allPracticeTimes.length
        : 60;

    // Use defaults if no data, otherwise merge with defaults
    const defaults = getDefaultTimeAverages();
    return {
      avgTimePerTeachSec: defaults.avgTimePerTeachSec,
      avgTimePerPracticeSec: avgPracticeTime || defaults.avgTimePerPracticeSec,
      avgTimeByDeliveryMethod:
        avgByMethod.size > 0 ? avgByMethod : defaults.avgTimeByDeliveryMethod,
      avgTimeByQuestionType: defaults.avgTimeByQuestionType,
    };
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

    // Filter out teachings that have already been completed by the user
    // This ensures we don't re-show content the user has already learned
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
      const questionData = await this.contentLookup.getQuestionData(
        question.id,
        lessonId,
        deliveryMethod,
      );
      if (!questionData) {
        console.error(
          `Failed to get question data for question ${question.id}. Question may be missing teaching relationship.`,
          {
            questionId: question.id,
            teachingId: question.teachingId,
            lessonId,
            deliveryMethod,
          },
        );
        // For MULTIPLE_CHOICE, we cannot proceed without question data
        if (deliveryMethod === DELIVERY_METHOD.MULTIPLE_CHOICE) {
          console.error(
            `MULTIPLE_CHOICE question ${question.id} cannot proceed without question data. Frontend will show placeholder options.`,
          );
        }
      } else {
        // Override prompt if available
        if (questionData.prompt) {
          baseItem.prompt = questionData.prompt;
        }

        // Populate delivery method specific fields
        if (deliveryMethod === DELIVERY_METHOD.MULTIPLE_CHOICE) {
          // Only set options if they exist and are valid
          if (
            questionData.options &&
            Array.isArray(questionData.options) &&
            questionData.options.length > 0
          ) {
            baseItem.options = questionData.options;
          }
          if (questionData.correctOptionId) {
            baseItem.correctOptionId = questionData.correctOptionId;
          }
          if (questionData.sourceText) {
            baseItem.sourceText = questionData.sourceText; // For translation MCQ
          }

          // Validate that we have required fields for MCQ
          if (!baseItem.options || !baseItem.correctOptionId) {
            console.error(
              `MULTIPLE_CHOICE question ${question.id} missing required data:`,
              {
                hasOptions: !!baseItem.options,
                optionsLength: baseItem.options?.length,
                hasCorrectOptionId: !!baseItem.correctOptionId,
                questionDataKeys: Object.keys(questionData),
                questionDataOptions: questionData.options,
                questionDataCorrectOptionId: questionData.correctOptionId,
              },
            );
          }
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
          if (
            deliveryMethod === DELIVERY_METHOD.TEXT_TO_SPEECH &&
            question.teaching
          ) {
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
        console.error(
          `MULTIPLE_CHOICE question ${question.id} failed to generate options. Teaching ID: ${question.teachingId}, Lesson ID: ${lessonId}`,
        );
        // For MCQ, we cannot proceed without options - this will cause the frontend to show placeholders
        // The error is logged above, and the baseItem will be returned without options
        // The frontend transformer will detect this and create fallback options
      }
    }

    // Final validation for MULTIPLE_CHOICE - ensure we have required fields
    if (deliveryMethod === DELIVERY_METHOD.MULTIPLE_CHOICE) {
      if (!baseItem.options || !baseItem.correctOptionId) {
        console.error(
          `MULTIPLE_CHOICE question ${question.id} final validation failed - missing options or correctOptionId. This will cause frontend to show placeholder options.`,
          {
            hasOptions: !!baseItem.options,
            optionsLength: baseItem.options?.length,
            hasCorrectOptionId: !!baseItem.correctOptionId,
            teachingId: question.teachingId,
            lessonId,
          },
        );
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
    const teachTestIndex = 0;

    // Group teach-test sequence into pairs
    const pairs: DeliveryCandidate[][] = [];
    for (let i = 0; i < teachTestSequence.length; i++) {
      const item = teachTestSequence[i];
      if (item.kind === 'teaching' && i + 1 < teachTestSequence.length) {
        const nextItem = teachTestSequence[i + 1];
        if (
          nextItem.kind === 'question' &&
          nextItem.teachingId === item.teachingId
        ) {
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
   * Merges stored performance scores with onboarding-based defaults.
   */
  private async getDeliveryMethodScores(
    userId: string,
  ): Promise<Map<DELIVERY_METHOD, number>> {
    // Get stored performance scores
    const storedScores = await this.prisma.userDeliveryMethodScore.findMany({
      where: { userId },
    });

    const map = new Map<DELIVERY_METHOD, number>();

    // If user has stored scores, use them (they reflect actual performance)
    if (storedScores.length > 0) {
      storedScores.forEach((s) => {
        map.set(s.deliveryMethod, s.score);
      });
      return map;
    }

    // If no stored scores, use onboarding-based defaults
    const onboardingScores =
      await this.onboardingPreferences.getInitialDeliveryMethodScores(userId);
    return onboardingScores;
  }

  private pickPrioritizedSkill(
    stepSkillTags: string[] | undefined,
    prioritizedSkills: string[] = [],
  ): string | undefined {
    if (
      !stepSkillTags ||
      stepSkillTags.length === 0 ||
      prioritizedSkills.length === 0
    ) {
      return undefined;
    }

    const prioritizedSet = new Set(prioritizedSkills);
    return stepSkillTags.find((t) => prioritizedSet.has(t));
  }

  private buildStepRationale(
    candidate: DeliveryCandidate,
    prioritizedSkills: string[] = [],
  ): string {
    // Reviews
    if (candidate.dueScore > 0) {
      return 'Due review';
    }

    // Targeting low mastery skills (if skill tags are present)
    const prioritizedTag = this.pickPrioritizedSkill(
      candidate.skillTags,
      prioritizedSkills,
    );
    if (prioritizedTag) {
      return `Targets low mastery skill: ${prioritizedTag}`;
    }

    // Consolidation after errors
    if (candidate.errorScore >= 2) {
      return 'Consolidation after recent errors';
    }

    // Scaffolding: easy win
    if (
      typeof candidate.difficulty === 'number' &&
      candidate.difficulty <= 0.2
    ) {
      return 'Scaffolding: quick win';
    }

    // New teaching content
    if (candidate.kind === 'teaching') {
      return 'Introducing new phrase';
    }

    return 'Next practice item';
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
