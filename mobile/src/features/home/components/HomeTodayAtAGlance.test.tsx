import React from 'react';
import renderer from 'react-test-renderer';

import { HomeTodayAtAGlance } from '@/features/home/components/HomeTodayAtAGlance';

jest.mock('@/services/theme/ThemeProvider', () => ({
  useAppTheme: () => ({
    theme: {
      colors: {
        text: '#000',
        mutedText: '#666',
        secondary: '#0E9A82',
      },
    },
    isDark: false,
  }),
}));

describe('HomeTodayAtAGlance', () => {
  it('does not include "reviews due" or "Reviews due" in Today\'s Progress', () => {
    const tree = renderer.create(
      <HomeTodayAtAGlance minutesToday={5} completedItemsToday={3} onSuggestLearn={jest.fn()} />,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).not.toMatch(/reviews?\s*due/i);
  });

  it('shows time studied today as X/10 min and completed count when not all zero', () => {
    const tree = renderer.create(
      <HomeTodayAtAGlance minutesToday={7} completedItemsToday={4} onSuggestLearn={jest.fn()} />,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('7');
    expect(json).toContain('10');
    expect(json).toMatch(/min/);
    expect(json).toContain('4');
  });

  it('shows empty state message when minutesToday and completedItemsToday are 0', () => {
    const tree = renderer.create(
      <HomeTodayAtAGlance minutesToday={0} completedItemsToday={0} onSuggestLearn={jest.fn()} />,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toMatch(/Start a 5-minute session to build momentum/);
  });
});
