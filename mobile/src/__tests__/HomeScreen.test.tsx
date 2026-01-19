import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import renderer from 'react-test-renderer';

import HomeScreen from '@/features/home/screens/HomeScreen';
import { ThemeProvider } from '@/services/theme/ThemeProvider';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn() },
  useFocusEffect: (cb: any) => cb(),
}));

jest.mock('@/services/api/profile', () => ({
  getMyProfile: jest.fn().mockResolvedValue({ name: 'Test User' }),
  getDashboard: jest
    .fn()
    .mockResolvedValue({ streak: 0, dueReviewCount: 0, activeLessonCount: 0, xpTotal: 0 }),
  getStats: jest.fn().mockResolvedValue({ minutesToday: 0 }),
  getRecentActivity: jest.fn().mockResolvedValue({ recentLesson: null, recentTeaching: null, recentQuestion: null }),
}));

jest.mock('@/services/api/learn', () => ({
  getSuggestions: jest.fn().mockResolvedValue({
    lessons: [
      {
        lesson: { id: 'lesson-1', title: 'Lesson 1' },
        module: { id: 'module-1', title: 'Basics' },
        reason: 'Recommended next',
      },
    ],
    modules: [],
  }),
}));

jest.mock('@/services/api/modules', () => ({
  getLesson: jest.fn().mockResolvedValue({ id: 'lesson-1', title: 'Lesson 1', numberOfItems: 3, moduleId: 'module-1' }),
  getLessonTeachings: jest.fn().mockResolvedValue([
    { id: 't1', userLanguageString: 'Hello', learningLanguageString: 'Ciao', lessonId: 'lesson-1' },
    { id: 't2', userLanguageString: 'My name is', learningLanguageString: 'Mi chiamo', lessonId: 'lesson-1' },
  ]),
}));

describe('HomeScreen', () => {
  it('renders a daily launchpad with a single next action', () => {
    const tree = renderer
      .create(
        <SafeAreaProvider>
          <ThemeProvider>
            <HomeScreen />
          </ThemeProvider>
        </SafeAreaProvider>,
      )
      .toJSON();
    expect(tree).toBeTruthy();
  });
});
