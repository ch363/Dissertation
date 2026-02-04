import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentLookupService } from '../../content/content-lookup.service';
import { DELIVERY_METHOD } from '@prisma/client';
import { LoggerService } from '../../common/logger';
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
  private readonly logger = new LoggerService(SessionPlanService.name);

  constructor(
    private prisma: PrismaService,
    private contentLookup: ContentLookupService,
    private masteryService: MasteryService,
    private onboardingPreferences: OnboardingPreferencesService,
    private candidateService: CandidateService,
  ) {}

  async createPlan(
    userId: string,
    context: SessionContext,
  ): Promise<SessionPlanDto> {
    const now = new Date();
    const sessionId = `session-${userId}-${Date.now()}`;

    const onboardingPrefs =
      await this.onboardingPreferences.getOnboardingPreferences(userId);
    const challengeWeight = onboardingPrefs.challengeWeight;

    let effectiveTimeBudgetSec = context.timeBudgetSec;
    if (!effectiveTimeBudgetSec && onboardingPrefs.sessionMinutes) {
      effectiveTimeBudgetSec = onboardingPrefs.sessionMinutes * 60;
    }

    const userTimeAverages = await this.getUserAverageTimes(userId);

    const avgTimePerItem =
      (userTimeAverages.avgTimePerTeachSec +
        userTimeAverages.avgTimePerPracticeSec) /
      2;
    let targetItemCount = effectiveTimeBudgetSec
      ? calculateItemCount(effectiveTimeBudgetSec, avgTimePerItem)
      : 15;

    const seenTeachingIds = await this.getSeenTeachingIds(userId);

    const prioritizedSkills = await this.masteryService.getLowMasterySkills(
      userId,
      0.5,
    );

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

    let selectedCandidates: DeliveryCandidate[] = [];
    if (context.mode === 'review') {
      // Ensure each question appears at most once to prevent the same question looping
      const byId = new Map<string, DeliveryCandidate>();
      for (const c of reviewCandidates) {
        if (!byId.has(c.id)) byId.set(c.id, c);
      }
      selectedCandidates = Array.from(byId.values());
    } else if (context.mode === 'learn') {
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

      if (rankedNew.length >= targetItemCount) {
        selectedCandidates = rankedNew;
      } else {
        const newCount = rankedNew.length;
        const reviewCount = targetItemCount - newCount;
        selectedCandidates = [
          ...rankedNew,
          ...rankedReviews.slice(0, reviewCount),
        ];
      }
    } else {
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
      const reviewCount = Math.floor(targetItemCount * 0.7);
      const newCount = targetItemCount - reviewCount;
      selectedCandidates = [
        ...rankedReviews.slice(0, reviewCount),
        ...rankedNew.slice(0, newCount),
      ];
    }

    // Review mode: ensure we include multiple items when available so the user
    // sees a full batch of reviews before the summary (not one summary per item).
    if (context.mode === 'review' && selectedCandidates.length > 1) {
      const minReviewCount = Math.min(10, selectedCandidates.length);
      targetItemCount = Math.max(targetItemCount, minReviewCount);
    }

    selectedCandidates = selectedCandidates.slice(0, targetItemCount);

    const newQuestions = selectedCandidates.filter(
      (c) => c.kind === 'question' && c.dueScore === 0,
    );
    const reviews = selectedCandidates.filter((c) => c.dueScore > 0);

    const teachingCandidates = await this.getTeachingCandidates(
      userId,
      newQuestions,
      seenTeachingIds,
      context.lessonId,
      context.moduleId,
    );

    let finalCandidates: DeliveryCandidate[] = [];
    if (context.mode === 'learn' || context.mode === 'mixed') {
      const teachingsForNew = teachingCandidates.filter((t) =>
        newQuestions.some((q) => q.teachingId === t.teachingId),
      );
      const teachThenTestSequence = planTeachThenTest(
        teachingsForNew,
        newQuestions,
        seenTeachingIds,
      );

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
            teachTestPairs.push([item, nextItem]);
            i++;
            continue;
          }
        }
        standaloneItems.push(item);
      }

      if (reviews.length > 0) {
        const interleavedReviews = composeWithInterleaving(reviews, {
          maxSameTypeInRow: 2,
          requireModalityCoverage: false, // Don't require coverage for reviews
          enableScaffolding: false,
          consecutiveErrors: 0,
        });
        finalCandidates = this.interleaveWithPairs(
          interleavedReviews,
          teachThenTestSequence,
        );
      } else {
        finalCandidates = teachThenTestSequence;
      }
    } else {
      finalCandidates = composeWithInterleaving(selectedCandidates, {
        maxSameTypeInRow: 2,
        requireModalityCoverage: true,
        enableScaffolding: true,
        consecutiveErrors: 0,
      });
    }

    const userPreferences = await this.getDeliveryMethodScores(userId);

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
              recentMethods.shift();
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
            });
          }
        }
      }
    }

    const totalEstimatedTime = steps.reduce(
      (sum, step) => sum + step.estimatedTimeSec,
      0,
    );
    const potentialXp = steps.filter((s) => s.type === 'practice').length * 15;

    const recapItem: RecapStepItem = {
      type: 'recap',
      summary: {
        totalItems: steps.length,
        correctCount: 0,
        accuracy: 0,
        timeSpentSec: 0,
        xpEarned: potentialXp,
        streakDays: undefined,
      },
    };

    steps.push({
      stepNumber: stepNumber,
      type: 'recap',
      item: recapItem,
      estimatedTimeSec: 10,
    });

    const metadata: SessionMetadata = {
      totalEstimatedTimeSec: totalEstimatedTime + 10,
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

  private async getUserAverageTimes(userId: string): Promise<UserTimeAverages> {
    let performances;
    try {
      performances = await this.prisma.userQuestionPerformance.findMany({
        where: { userId },
        select: {
          timeToComplete: true,
          deliveryMethod: true,
        },
        take: 100,
      });
    } catch (error: any) {
      if (
        error?.message?.includes('column') ||
        error?.message?.includes('does not exist') ||
        error?.message?.includes('not available')
      ) {
        return getDefaultTimeAverages();
      }
      throw error;
    }

    const methodTimes = new Map<DELIVERY_METHOD, number[]>();
    const allPracticeTimes: number[] = [];

    for (const perf of performances) {
      if (perf.timeToComplete) {
        allPracticeTimes.push(perf.timeToComplete / 1000);

        const deliveryMethod = perf.deliveryMethod;
        if (!methodTimes.has(deliveryMethod)) {
          methodTimes.set(deliveryMethod, []);
        }
        methodTimes.get(deliveryMethod)!.push(perf.timeToComplete / 1000);
      }
    }

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

    const defaults = getDefaultTimeAverages();
    return {
      avgTimePerTeachSec: defaults.avgTimePerTeachSec,
      avgTimePerPracticeSec: avgPracticeTime || defaults.avgTimePerPracticeSec,
      avgTimeByDeliveryMethod:
        avgByMethod.size > 0 ? avgByMethod : defaults.avgTimeByDeliveryMethod,
      avgTimeByQuestionType: defaults.avgTimeByQuestionType,
    };
  }

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

  private async getQuestionData(questionId: string) {
    return this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        teaching: {
          select: {
            id: true,
            userLanguageString: true,
            learningLanguageString: true,
            emoji: true,
            tip: true,
          },
        },
      },
    });
  }

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

    if (question.teaching) {
      baseItem.prompt = question.teaching.learningLanguageString;
    }

    try {
      const questionData = await this.contentLookup.getQuestionData(
        question.id,
        lessonId,
        deliveryMethod,
      );
      if (!questionData) {
        this.logger.logError(
          'Failed to get question data. Question may be missing teaching relationship',
          undefined,
          {
            questionId: question.id,
            teachingId: question.teachingId,
            lessonId,
            deliveryMethod,
          },
        );
        if (deliveryMethod === DELIVERY_METHOD.MULTIPLE_CHOICE) {
          this.logger.logError(
            'MULTIPLE_CHOICE question cannot proceed without question data. Frontend will show placeholder options',
            undefined,
            { questionId: question.id },
          );
        }
      } else {
        if (questionData.prompt) {
          baseItem.prompt = questionData.prompt;
        }

        if (deliveryMethod === DELIVERY_METHOD.MULTIPLE_CHOICE) {
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
            baseItem.sourceText = questionData.sourceText;
          }

          if (!baseItem.options || !baseItem.correctOptionId) {
            this.logger.logError(
              `MULTIPLE_CHOICE question ${question.id} missing required data`,
              undefined,
              {
                questionId: question.id,
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
          if (questionData.options && questionData.options.length > 0) {
            baseItem.options = questionData.options;
          }
        } else if (deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION) {
          baseItem.source = questionData.source;
          baseItem.answer = questionData.answer;
          baseItem.hint = questionData.hint;
        } else if (deliveryMethod === DELIVERY_METHOD.FLASHCARD) {
          baseItem.source = questionData.source;
          baseItem.answer = questionData.answer;
          baseItem.hint = questionData.hint;
          if (question.teaching) {
            baseItem.emoji = question.teaching.emoji ?? undefined;
            baseItem.tip = question.teaching.tip ?? undefined;
          }
        } else if (
          deliveryMethod === DELIVERY_METHOD.SPEECH_TO_TEXT ||
          deliveryMethod === DELIVERY_METHOD.TEXT_TO_SPEECH
        ) {
          baseItem.answer = questionData.answer;
          if (
            deliveryMethod === DELIVERY_METHOD.TEXT_TO_SPEECH &&
            question.teaching
          ) {
            baseItem.translation = question.teaching.userLanguageString;
          }
        }
      }
    } catch (error) {
      this.logger.logError('Failed to load question data', error, {
        questionId: question.id,
        teachingId: question.teachingId,
        lessonId,
        deliveryMethod,
      });
      if (deliveryMethod === DELIVERY_METHOD.MULTIPLE_CHOICE) {
        this.logger.logError(
          'MULTIPLE_CHOICE question failed to generate options',
          undefined,
          {
            questionId: question.id,
            teachingId: question.teachingId,
            lessonId,
          },
        );
      }
    }

    if (deliveryMethod === DELIVERY_METHOD.MULTIPLE_CHOICE) {
      if (!baseItem.options || !baseItem.correctOptionId) {
        this.logger.logError(
          'MULTIPLE_CHOICE question final validation failed - missing options or correctOptionId',
          undefined,
          {
            questionId: question.id,
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

  private async getSeenTeachingIds(userId: string): Promise<Set<string>> {
    const completed = await this.prisma.userTeachingCompleted.findMany({
      where: { userId },
      select: { teachingId: true },
    });
    return new Set(completed.map((c) => c.teachingId));
  }

  private interleaveWithPairs(
    reviews: DeliveryCandidate[],
    teachTestSequence: DeliveryCandidate[],
  ): DeliveryCandidate[] {
    const result: DeliveryCandidate[] = [];
    let reviewIndex = 0;
    const teachTestIndex = 0;

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
          i++;
          continue;
        }
      }
      pairs.push([item]);
    }

    let pairIndex = 0;
    while (pairIndex < pairs.length || reviewIndex < reviews.length) {
      if (pairIndex < pairs.length) {
        result.push(...pairs[pairIndex]);
        pairIndex++;
      }
      if (reviewIndex < reviews.length) {
        result.push(reviews[reviewIndex]);
        reviewIndex++;
      }
    }

    return result;
  }

  private async getDeliveryMethodScores(
    userId: string,
  ): Promise<Map<DELIVERY_METHOD, number>> {
    const storedScores = await this.prisma.userDeliveryMethodScore.findMany({
      where: { userId },
    });

    const map = new Map<DELIVERY_METHOD, number>();

    if (storedScores.length > 0) {
      storedScores.forEach((s) => {
        map.set(s.deliveryMethod, s.score);
      });
      return map;
    }

    const onboardingScores =
      await this.onboardingPreferences.getInitialDeliveryMethodScores(userId);
    return onboardingScores;
  }

  private buildTitle(context: SessionContext): string{
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
