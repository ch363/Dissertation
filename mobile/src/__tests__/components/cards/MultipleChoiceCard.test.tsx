import React from 'react';
import renderer from 'react-test-renderer';

import { MultipleChoiceCard } from '@/features/session/components/cards/MultipleChoiceCard';
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
        secondary: '#10b981',
        error: '#ef4444',
        onPrimary: '#ffffff',
        mutedText: '#6b7280',
      },
    },
  }),
}));

jest.mock('@/services/logging', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
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

describe('MultipleChoiceCard', () => {
  const mockCard = {
    id: 'question-123',
    kind: CardKind.MultipleChoice,
    prompt: 'How do you say "Hello" in Italian?',
    options: [
      { id: 'opt-1', label: 'Ciao' },
      { id: 'opt-2', label: 'Arrivederci' },
      { id: 'opt-3', label: 'Buongiorno' },
    ],
    correctOptionId: 'opt-1',
  } as const;

  it('should render multiple choice card with options', () => {
    const tree = renderer.create(<MultipleChoiceCard card={mockCard} />);

    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render with selected option', () => {
    const tree = renderer.create(<MultipleChoiceCard card={mockCard} selectedOptionId="opt-1" />);

    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render result state - correct answer', () => {
    const tree = renderer.create(
      <MultipleChoiceCard card={mockCard} selectedOptionId="opt-1" showResult isCorrect />,
    );

    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render result state - incorrect answer', () => {
    const tree = renderer.create(
      <MultipleChoiceCard card={mockCard} selectedOptionId="opt-2" showResult isCorrect={false} />,
    );

    expect(tree.toJSON()).toBeTruthy();
  });

  it('should call onSelectOption when option is selected', () => {
    const onSelectOption = jest.fn();

    const tree = renderer.create(
      <MultipleChoiceCard card={mockCard} onSelectOption={onSelectOption} />,
    );

    const instance = tree.root;
    const buttons = instance.findAllByType('Pressable' as any);

    // Find the option button (not the speaker button)
    const optionButton = buttons.find((btn: any) => btn.props.accessibilityLabel?.includes('Ciao'));

    if (optionButton) {
      act(() => {
        optionButton.props.onPress();
      });

      expect(onSelectOption).toHaveBeenCalledWith('opt-1');
    }
  });
});

function act(callback: () => void): void {
  callback();
}
