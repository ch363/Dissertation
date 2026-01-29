import type { Lesson, Module } from '@/services/api/modules';
import type { UserLessonProgress } from '@/services/api/progress';
import { routeBuilders } from '@/services/navigation/routes';

export type LearningPathItem = {
  id: string;
  title: string;
  subtitle: string;
  status: 'active' | 'locked';
  completedLessons: number;
  totalLessons: number;
  completedSegments: number;
  totalSegments: number;
  ctaLabel?: string;
  route: string;
  imageUrl?: string;
  category?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function buildLearningPathItems(args: {
  modules: Module[];
  lessons: Lesson[];
  userProgress: UserLessonProgress[];
  maxSegments?: number;
}): LearningPathItem[] {
  const maxSegments = args.maxSegments ?? 8;
  const progressByLessonId = new Map(args.userProgress.map((p) => [p.lesson.id, p]));

  const lessonsByModuleId = new Map<string, Lesson[]>();
  for (const lesson of args.lessons) {
    const existing = lessonsByModuleId.get(lesson.moduleId) ?? [];
    existing.push(lesson);
    lessonsByModuleId.set(lesson.moduleId, existing);
  }

  const sortedModules = [...args.modules].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const moduleCompletion = new Map<string, { completed: boolean; completedLessons: number; totalLessons: number }>();
  for (const mod of sortedModules) {
    const moduleLessons = lessonsByModuleId.get(mod.id) ?? [];
    const totalLessons = moduleLessons.length;
    let completedLessons = 0;

    for (const lesson of moduleLessons) {
      const p = progressByLessonId.get(lesson.id);
      const totalTeachings = p?.totalTeachings ?? lesson.numberOfItems ?? 0;
      const completedTeachings = p?.completedTeachings ?? 0;
      if (totalTeachings > 0 && completedTeachings >= totalTeachings) {
        completedLessons++;
      }
    }

    const completed = totalLessons > 0 && completedLessons === totalLessons;
    moduleCompletion.set(mod.id, { completed, completedLessons, totalLessons });
  }

  // Simple gate: module i unlocks when all previous modules completed.
  const unlockedByIndex = sortedModules.map((m, idx) => {
    if (idx === 0) return true;
    for (let j = 0; j < idx; j++) {
      if (!moduleCompletion.get(sortedModules[j].id)?.completed) return false;
    }
    return true;
  });

  return sortedModules.map((mod, idx) => {
    const completion = moduleCompletion.get(mod.id) ?? { completed: false, completedLessons: 0, totalLessons: 0 };
    const isUnlocked = unlockedByIndex[idx];
    const status: 'active' | 'locked' = isUnlocked ? 'active' : 'locked';

    const totalSegments = clamp(Math.min(maxSegments, completion.totalLessons || 1), 1, maxSegments);
    const ratio = completion.totalLessons > 0 ? completion.completedLessons / completion.totalLessons : 0;
    const completedSegments = completion.totalLessons > 0 ? clamp(Math.round(ratio * totalSegments), 0, totalSegments) : 0;

    const lockedBy = idx > 0 ? sortedModules[idx - 1]?.title : undefined;
    const subtitle =
      status === 'locked'
        ? lockedBy
          ? `Locked by completing ${lockedBy}`
          : 'Locked'
        : completion.totalLessons > 0
          ? `${completion.completedLessons}/${completion.totalLessons} completed`
          : 'No lessons yet';

    const ctaLabel = status === 'locked' ? undefined : completion.completed ? 'View' : 'Continue';

    return {
      id: mod.id,
      title: mod.title,
      subtitle,
      status,
      completedLessons: completion.completedLessons,
      totalLessons: completion.totalLessons,
      completedSegments,
      totalSegments,
      ctaLabel,
      route: routeBuilders.courseDetail(mod.id),
      imageUrl: mod.imageUrl,
      category: mod.description,
    };
  });
}

