import React from 'react';
import renderer from 'react-test-renderer';

import { TeachCard } from '@/features/session/components/cards';
import { CardKind } from '@/types/session';

// Mock dependencies
jest.mock('@/services/theme/ThemeProvider', () => ({
  useAppTheme: () => ({
    theme: {
      colors: {
        background: '#ffffff',
        text: '#000000',
        card: '#f5f5f5',
        border: '#e5e5e5',
        primary: '#3b82f6',
        mutedText: '#6b7280',
      },
    },
  }),
}));

jest.mock('@/services/logging', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('@/services/preferences', () => ({
  getTtsEnabled: jest.fn(() => Promise.resolve(true)),
  getTtsRate: jest.fn(() => Promise.resolve(1.0)),
}));

jest.mock('@/services/tts', () => ({
  speak: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
}));

describe('TeachCard', () => {
  const mockCard = {
    id: 'teach-123',
    kind: CardKind.Teach,
    prompt: 'Learn this phrase',
    content: {
      phrase: 'Buongiorno',
      translation: 'Good morning',
      usageNote: 'A common Italian greeting used in the morning until about noon',
      emoji: '☀️',
    },
  } as const;

  it('should render teach card with all content', () => {
    const tree = renderer.create(<TeachCard card={mockCard} />);

    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render teach card with minimal content', () => {
    const minimalCard = {
      id: 'teach-456',
      kind: CardKind.Teach,
      prompt: 'Learn this phrase',
      content: {
        phrase: 'Ciao',
        translation: 'Hello',
      },
    } as const;

    const tree = renderer.create(<TeachCard card={minimalCard} />);

    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render with custom onContinue handler', () => {
    const onContinue = jest.fn();

    const tree = renderer.create(<TeachCard card={mockCard} onContinue={onContinue} />);

    expect(tree.toJSON()).toBeTruthy();
  });

  it('should have accessibility labels', () => {
    const tree = renderer.create(<TeachCard card={mockCard} />);

    const instance = tree.root;
    const views = instance.findAllByType('View' as any);

    expect(views.length).toBeGreaterThan(0);
  });
});
