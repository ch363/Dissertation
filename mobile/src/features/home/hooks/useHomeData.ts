import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getSuggestions } from '@/services/api/learn';
import { getAllMastery } from '@/services/api/mastery';
import { getLesson, getLessonTeachings } from '@/services/api/modules';
import {
  getDashboard,
  getMyProfile,
  getRecentActivity,
  getStats,
  type AccuracyByDeliveryMethod,
  type GrammaticalAccuracyByDeliveryMethod,
} from '@/services/api/profile';
import { selectHomeNextAction, type HomeNextAction } from '../utils/selectHomeNextAction';
import { buildLessonOutcome } from '@/features/learn/utils/lessonOutcome';
import { formatLessonDetail } from '../utils/formatLessonDetail';
import { createLogger } from '@/services/logging';

const logger = createLogger('useHomeData');

export interface HomeData {
  displayName: string | null;
  xpTotal: number;
  streakDays: number;
  minutesToday: number;
  completedItemsToday: number;
  accuracyToday: number | null;
  dueReviewCount: number;
  estimatedReviewMinutes: number | null;
  mastery: Array<{ skillTag: string; masteryProbability: number }>;
  accuracyByDeliveryMethod: AccuracyByDeliveryMethod | null;
  grammaticalAccuracyByDeliveryMethod: GrammaticalAccuracyByDeliveryMethod | null;
  nextAction: HomeNextAction | null;
  nextLessonItemCount: number | null;
  whyThisText: string;
  lastActivityTopic: string | null;
  inProgressLesson: {
    lessonId: string;
    lessonTitle: string;
    moduleTitle: string;
    completedTeachings: number;
    totalTeachings: number;
    estTime: string;
  } | null;
  isLoading: boolean;
  loadData: () => Promise<void>;
}

export function useHomeData(): HomeData {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [minutesToday, setMinutesToday] = useState<number>(0);
  const [completedItemsToday, setCompletedItemsToday] = useState<number>(0);
  const [accuracyToday, setAccuracyToday] = useState<number | null>(null);
  const [dueReviewCount, setDueReviewCount] = useState<number>(0);
  const [xpTotal, setXpTotal] = useState<number>(0);
  const [mastery, setMastery] = useState<Array<{ skillTag: string; masteryProbability: number }>>([]);
  const [estimatedReviewMinutes, setEstimatedReviewMinutes] = useState<number | null>(null);
  const [nextAction, setNextAction] = useState<HomeNextAction | null>(null);
  const [nextLessonItemCount, setNextLessonItemCount] = useState<number | null>(null);
  const [accuracyByDeliveryMethod, setAccuracyByDeliveryMethod] = useState<AccuracyByDeliveryMethod | null>(null);
  const [grammaticalAccuracyByDeliveryMethod, setGrammaticalAccuracyByDeliveryMethod] =
    useState<GrammaticalAccuracyByDeliveryMethod | null>(null);
  const [whyThisText, setWhyThisText] = useState<string>('You\'ll build confidence with practical phrases.');
  const [lastActivityTopic, setLastActivityTopic] = useState<string | null>(null);
  const [inProgressLesson, setInProgressLesson] = useState<{
    lessonId: string;
    lessonTitle: string;
    moduleTitle: string;
    completedTeachings: number;
    totalTeachings: number;
    estTime: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [profile, dashboardData, statsData, recentActivity, suggestions, masteryData] = await Promise.all([
        getMyProfile().catch(() => null),
        getDashboard().catch(() => ({
          streak: 0,
          dueReviewCount: 0,
          activeLessonCount: 0,
          xpTotal: 0,
          weeklyXP: 0,
          weeklyXPChange: 0,
          accuracyPercentage: 0,
          accuracyByDeliveryMethod: {},
          grammaticalAccuracyByDeliveryMethod: {},
          studyTimeMinutes: 0,
        })),
        getStats().catch(() => ({ minutesToday: 0, completedItemsToday: 0 })),
        getRecentActivity().catch(() => null),
        getSuggestions({ limit: 1 }).catch(() => ({ lessons: [], modules: [] })),
        getAllMastery().catch(() => []),
      ]);

      const name = profile?.name?.trim();
      setDisplayName(name || null);
      setStreakDays(dashboardData.streak || 0);
      setMinutesToday(statsData.minutesToday || 0);
      setCompletedItemsToday(statsData.completedItemsToday ?? 0);
      setAccuracyToday(
        'accuracyToday' in statsData && typeof statsData.accuracyToday === 'number'
          ? statsData.accuracyToday
          : null,
      );
      setDueReviewCount(dashboardData.dueReviewCount || 0);
      setXpTotal(dashboardData.xpTotal || 0);
      setMastery(masteryData);
      setAccuracyByDeliveryMethod(dashboardData.accuracyByDeliveryMethod || null);
      setGrammaticalAccuracyByDeliveryMethod(dashboardData.grammaticalAccuracyByDeliveryMethod || null);

      if (dashboardData.estimatedReviewMinutes != null) {
        setEstimatedReviewMinutes(dashboardData.estimatedReviewMinutes);
      }

      const firstSuggestedLesson = suggestions.lessons[0] || null;
      const action = selectHomeNextAction({
        dueReviewCount: dashboardData.dueReviewCount || 0,
        suggestedLesson: firstSuggestedLesson,
      });
      setNextAction(action);

      if (action.type === 'review') {
        const topicFromRecent =
          recentActivity?.lessons?.[0]?.lessonTitle || recentActivity?.modules?.[0]?.title || null;
        setLastActivityTopic(topicFromRecent);
      }

      if (firstSuggestedLesson) {
        const lessonDetail = await getLesson(firstSuggestedLesson.lessonId).catch(() => null);
        if (lessonDetail) {
          const teachings = await getLessonTeachings(lessonDetail.id).catch(() => null);
          const outcome = buildLessonOutcome(lessonDetail, teachings || []);
          setNextLessonItemCount(outcome.totalTeachings || null);
          const formatted = formatLessonDetail({ lessonTitle: outcome.lesson.title || outcome.module.title });
          setWhyThisText(formatted.why);
          setInProgressLesson({
            lessonId: lessonDetail.id,
            lessonTitle: lessonDetail.title,
            moduleTitle: lessonDetail.module?.title || 'Module',
            completedTeachings: outcome.completedTeachings,
            totalTeachings: outcome.totalTeachings,
            estTime: `${outcome.totalTeachings || 0} items`,
          });
        }
      }
    } catch (error) {
      logger.error('Error loading home data', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  return {
    displayName,
    xpTotal,
    streakDays,
    minutesToday,
    completedItemsToday,
    accuracyToday,
    dueReviewCount,
    estimatedReviewMinutes,
    mastery,
    accuracyByDeliveryMethod,
    grammaticalAccuracyByDeliveryMethod,
    nextAction,
    nextLessonItemCount,
    whyThisText,
    lastActivityTopic,
    inProgressLesson,
    isLoading,
    loadData,
  };
}
