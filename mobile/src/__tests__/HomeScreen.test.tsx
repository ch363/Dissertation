import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import renderer from 'react-test-renderer';

import HomeScreen from '@/features/home/screens/HomeScreen';
import { ThemeProvider } from '@/services/theme/ThemeProvider';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

describe('HomeScreen', () => {
  it('renders modules list', () => {
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
