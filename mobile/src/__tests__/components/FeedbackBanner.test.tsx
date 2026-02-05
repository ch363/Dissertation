import React from 'react';
import renderer from 'react-test-renderer';

import { FeedbackBanner } from '@/components/session';

// Mock the theme provider
jest.mock('@/services/theme/ThemeProvider', () => ({
  useAppTheme: () => ({
    theme: {
      colors: {
        secondary: '#10b981',
        error: '#ef4444',
        text: '#1f2937',
      },
    },
  }),
}));

describe('FeedbackBanner', () => {
  it('should render correct feedback with default message', () => {
    const tree = renderer.create(<FeedbackBanner isCorrect />);

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('should render incorrect feedback with default message', () => {
    const tree = renderer.create(<FeedbackBanner isCorrect={false} />);

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('should render with custom message', () => {
    const tree = renderer.create(<FeedbackBanner isCorrect message="Great job!" />);

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('should render with message and details', () => {
    const tree = renderer.create(
      <FeedbackBanner
        isCorrect={false}
        message="Not quite"
        details="Your answer was close but contained a grammatical error"
      />,
    );

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('should have correct accessibility attributes', () => {
    const tree = renderer.create(
      <FeedbackBanner
        isCorrect
        message="Correct answer"
        accessibilityLabel="Test accessibility label"
      />,
    );

    const testInstance = tree.root;
    const view = testInstance.findByType('View' as any);

    expect(view.props.accessibilityRole).toBe('alert');
  });
});
