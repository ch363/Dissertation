export type ContinueLesson = {
  courseTitle: string;
  lessonTitle: string;
  minutesAway: number;
  progressLabel: string;
  progress: number; // 0 - 1
};

export type LearningPathCard = {
  id: string;
  title: string;
  level: string;
  flag: string;
  subtitle: string;
  completed?: number;
  total?: number;
  status: 'active' | 'locked';
  cta?: string;
};

export type PracticeTool = {
  id: 'flashcards' | 'typing' | 'listening';
  title: string;
  subtitle: string;
  color: string;
  route: string;
  locked?: boolean;
};

export type ReviewSummary = {
  dueCount: number;
  progress: number; // 0-1
  subtitle: string;
};

export type DiscoverCard = {
  id: string;
  title: string;
  subtitle: string;
  background: string;
};

export const learnMock = {
  streakCount: 6,
  continueLesson: {
    courseTitle: 'Basics',
    lessonTitle: 'Lesson 1 | CEFR A1',
    minutesAway: 6,
    progressLabel: '9/8 complete',
    progress: 0.68,
  } satisfies ContinueLesson,
  learningPath: [
    {
      id: 'basics',
      title: 'Basics',
      level: 'A1',
      flag: '🇮🇹',
      subtitle: 'Greetings & Essentials',
      completed: 5,
      total: 8,
      status: 'active',
      cta: 'Continue',
    },
    {
      id: 'food',
      title: 'Food',
      level: 'A1',
      flag: '🇮🇹',
      subtitle: 'Locked by completing Basics',
      status: 'locked',
    },
  ] satisfies LearningPathCard[],
  review: {
    dueCount: 5,
    progress: 0.32,
    subtitle: '5 items need review today',
  } satisfies ReviewSummary,
  discover: [
    {
      id: 'travel',
      title: 'Travelling in Italy',
      subtitle: 'Phrasebook for on-the-go trips',
      background: '#DFF2FF',
    },
    {
      id: 'food',
      title: 'Ordering Food',
      subtitle: 'Sound local at restaurants',
      background: '#FFF4DA',
    },
    {
      id: 'daily',
      title: 'Daily Conversations',
      subtitle: 'Talk with confidence',
      background: '#EAF0FF',
    },
  ] satisfies DiscoverCard[],
};
