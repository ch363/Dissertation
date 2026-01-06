import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import renderer from 'react-test-renderer';

import HomeScreen from '../app/home/index';

import { ThemeProvider } from '@/providers/ThemeProvider';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@/viewmodels/progress', () => ({
  useProgressSummary: () => ({
    completed: ['basics'],
    loading: false,
    error: null,
    refresh: jest.fn(),
    summary: { xp: 20, streak: 1, level: 1, updatedAt: Date.now() },
  }),
}));

describe('HomeScreen', () => {
  it('renders modules list', () => {
    const tree = renderer
      .create(
        <SafeAreaProvider>
          <ThemeProvider>
            <HomeScreen />
          </ThemeProvider>
        </SafeAreaProvider>
      )
      .toJSON();
    expect(tree).toBeTruthy();
  });
});
