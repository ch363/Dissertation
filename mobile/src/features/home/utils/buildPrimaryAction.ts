import type { HomePrimaryAction } from '@/features/home/components/HomePrimaryCtaCard';
import type { HomeNextAction } from '@/features/home/utils/selectHomeNextAction';
import {
  estimateReviewMinutes,
  formatReviewMinutesRange,
  formatReviewMinutesRangeFromEstimate,
} from '@/features/home/utils/estimateReviewMinutes';
import { formatLessonDetail } from '@/features/home/utils/formatLessonDetail';

export function buildPrimaryAction(
  nextAction: HomeNextAction | null,
  dueReviewCount: number,
  nextLessonItemCount: number | null,
  estimatedReviewMinutes: number | null,
): HomePrimaryAction {
  if (!nextAction) {
    return {
      kind: 'startNext',
      label: 'Start Next Lesson',
      subtitle: 'Loading your next step…',
    };
  }

  if (nextAction.kind === 'review') {
    const dueCount = nextAction.dueReviewCount;
    const minutes =
      estimatedReviewMinutes != null && estimatedReviewMinutes > 0
        ? estimatedReviewMinutes
        : estimateReviewMinutes(dueCount);
    const timeStr =
      estimatedReviewMinutes != null && estimatedReviewMinutes > 0
        ? formatReviewMinutesRangeFromEstimate(estimatedReviewMinutes)
        : formatReviewMinutesRange(dueCount);
    return {
      kind: 'review',
      label: 'Start Review',
      dueCount,
      estimatedReviewMinutes: minutes,
      subtitle: `Quick review • ${timeStr} • ${dueCount} due`,
    };
  }

  if (nextAction.kind === 'continue') {
    return {
      kind: 'continue',
      label: 'Continue Lesson',
      subtitle: nextAction.moduleTitle ?? nextAction.lessonTitle,
      detailLine: formatLessonDetail(nextLessonItemCount),
    };
  }

  if (dueReviewCount === 0) {
    return {
      kind: 'startNext',
      label: 'Learn something new',
      subtitle: "You're all caught up",
      detailLine: formatLessonDetail(nextLessonItemCount),
    };
  }

  return {
    kind: 'startNext',
    label: 'Start Next Lesson',
    subtitle: nextAction.moduleTitle ?? nextAction.lessonTitle ?? 'Jump into something new',
    detailLine: formatLessonDetail(nextLessonItemCount),
  };
}
