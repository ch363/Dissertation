export type HomeState = 'HAS_ACTIVE_LESSON' | 'HAS_DUE_LESSONS' | 'ALL_CAUGHT_UP';

export function deriveHomeState(args: {
  activeLesson: unknown | null;
  dueLessons: unknown[];
}): HomeState {
  const { activeLesson, dueLessons } = args;
  if (activeLesson) return 'HAS_ACTIVE_LESSON';
  if (dueLessons.length > 0) return 'HAS_DUE_LESSONS';
  return 'ALL_CAUGHT_UP';
}

export const HOME_COPY: Record<
  HomeState,
  {
    title: string;
    subtitle: string;
    primaryActionLabel: string;
  }
> = {
  HAS_ACTIVE_LESSON: {
    title: 'Welcome back',
    subtitle: 'Ready to pick up where you left off?',
    primaryActionLabel: 'Continue lesson',
  },
  HAS_DUE_LESSONS: {
    title: 'Welcome back',
    subtitle: 'You have something due today—let’s keep the momentum going.',
    primaryActionLabel: 'Start lesson',
  },
  ALL_CAUGHT_UP: {
    title: 'Welcome back',
    subtitle: 'You’re all caught up. Explore a new path to keep learning.',
    primaryActionLabel: 'Pick a path',
  },
};
