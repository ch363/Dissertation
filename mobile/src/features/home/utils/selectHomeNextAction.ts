import type { LearnSuggestionsResponse } from '@/services/api/learn';
import type { DashboardData, RecentActivity } from '@/services/api/profile';

export type HomeNextAction =
  | {
      kind: 'review';
      dueReviewCount: number;
      statusMessage: string;
    }
  | {
      kind: 'continue';
      lessonId: string;
      lessonTitle: string;
      moduleTitle?: string;
      progressLabel?: string;
      estTime?: string;
      /** For Focus card: "X lessons left • Y% complete" and progress bar. */
      completedTeachings: number;
      totalTeachings: number;
      statusMessage: string;
    }
  | {
      kind: 'startNext';
      lessonId?: string;
      lessonTitle?: string;
      moduleTitle?: string;
      reason?: string;
      statusMessage: string;
    };

export function selectHomeNextAction(args: {
  dashboard: DashboardData | null;
  recentActivity: RecentActivity | null;
  suggestions: LearnSuggestionsResponse | null;
}): HomeNextAction {
  const dueReviewCount = args.dashboard?.dueReviewCount ?? 0;
  if (dueReviewCount > 0) {
    return {
      kind: 'review',
      dueReviewCount,
      statusMessage:
        dueReviewCount === 1
          ? 'You have review due today'
          : `You have ${dueReviewCount} reviews due today`,
    };
  }

  const recent = args.recentActivity?.recentLesson ?? null;
  if (recent?.lesson?.id) {
    const totalTeachings = recent.totalTeachings ?? (recent.completedTeachings || 1);
    const isIncomplete =
      typeof recent.completedTeachings === 'number' && recent.completedTeachings < totalTeachings;
    if (isIncomplete) {
      const remainingTeachings = Math.max(0, totalTeachings - recent.completedTeachings);
      const minutesAway = Math.max(1, Math.ceil(remainingTeachings * 2));
      return {
        kind: 'continue',
        lessonId: recent.lesson.id,
        lessonTitle: recent.lesson.title,
        moduleTitle: recent.lesson.module.title,
        progressLabel: `${recent.completedTeachings}/${totalTeachings} complete`,
        estTime: `${minutesAway} min`,
        completedTeachings: recent.completedTeachings,
        totalTeachings,
        statusMessage: 'Pick up where you left off',
      };
    }
  }

  const suggestedLesson = args.suggestions?.lessons?.[0];
  if (suggestedLesson?.lesson?.id) {
    return {
      kind: 'startNext',
      lessonId: suggestedLesson.lesson.id,
      lessonTitle: suggestedLesson.lesson.title,
      moduleTitle: suggestedLesson.module.title,
      reason: suggestedLesson.reason,
      statusMessage: 'You’re all caught up. Want to start something new?',
    };
  }

  return {
    kind: 'startNext',
    statusMessage: 'You’re all caught up. Want to start something new?',
  };
}
