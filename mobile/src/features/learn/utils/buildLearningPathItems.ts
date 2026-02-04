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
  estimatedMinutes?: number;
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

  const moduleCompletion = new Map<
    string,
    { completed: boolean; completedLessons: number; totalLessons: number }
  >();
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

  const unlockedByIndex = sortedModules.map(() => true);

  return sortedModules.map((mod, idx) => {
    const completion = moduleCompletion.get(mod.id) ?? {
      completed: false,
      completedLessons: 0,
      totalLessons: 0,
    };
    const isUnlocked = unlockedByIndex[idx];
    const status: 'active' | 'locked' = isUnlocked ? 'active' : 'locked';

    const totalSegments = clamp(
      Math.min(maxSegments, completion.totalLessons || 1),
      1,
      maxSegments,
    );
    const ratio =
      completion.totalLessons > 0 ? completion.completedLessons / completion.totalLessons : 0;
    const completedSegments =
      completion.totalLessons > 0 ? clamp(Math.round(ratio * totalSegments), 0, totalSegments) : 0;

    const moduleLessonsForEst = lessonsByModuleId.get(mod.id) ?? [];
    const totalItems = moduleLessonsForEst.reduce((sum, l) => sum + (l.numberOfItems ?? 0), 0);
    const MIN_EST_MINUTES = 3;
    const MAX_EST_MINUTES = 15;
    const rawMinutes = Math.ceil(totalItems * 0.5);
    const estimatedMinutes =
      totalItems > 0 ? clamp(rawMinutes, MIN_EST_MINUTES, MAX_EST_MINUTES) : undefined;

    const subtitle =
      completion.totalLessons > 0
        ? `${completion.completedLessons}/${completion.totalLessons} completed`
        : 'No lessons yet';

    const ctaLabel =
      completion.completedLessons === 0
        ? `Start ${mod.title}`
        : completion.completed
          ? `Review ${mod.title}`
          : `Continue ${mod.title}`;

    return {
      id: mod.id,
      title: mod.title,
      subtitle,
      status,
      completedLessons: completion.completedLessons,
      totalLessons: completion.totalLessons,
      completedSegments,
      totalSegments,
      estimatedMinutes,
      ctaLabel,
      route: routeBuilders.courseDetail(mod.id),
      imageUrl: mod.imageUrl,
      category: mod.description,
    };
  });
}
