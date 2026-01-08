import { LessonContent, LessonSummary } from '@/features/content/contentTypes';
import { buildLessonSessionPlan } from '@/features/session/sessionBuilder';
import { SessionPlan } from '@/types/session';

const demoLessons: LessonSummary[] = [
  {
    id: 'basics-1',
    title: 'Basic greetings',
    level: 'beginner',
    tags: ['greetings'],
    estMinutes: 3,
  },
  {
    id: 'travel-1',
    title: 'Travel essentials',
    level: 'beginner',
    tags: ['travel'],
    estMinutes: 4,
  },
];

export async function listLessons(): Promise<LessonSummary[]> {
  // Wire to Supabase later
  return demoLessons;
}

export async function getLessonOverview(lessonId: string): Promise<LessonContent> {
  const lesson = demoLessons.find((l) => l.id === lessonId) ?? demoLessons[0];
  return {
    lesson,
    description: 'Preview of lesson goals and content outline.',
    heroImage: undefined,
  };
}

export async function getLessonSessionPlan(lessonId: string): Promise<SessionPlan> {
  return buildLessonSessionPlan(lessonId);
}
