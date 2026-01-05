import { useMemo } from 'react';

type LearningMode = {
  key: string;
  title: string;
  subtitle: string;
  cta: string;
  image?: string;
  variant: 'primary' | 'secondary';
};

export function useLearningModes() {
  const data = useMemo<LearningMode[]>(
    () => [
      {
        key: 'flashcards',
        title: 'Flashcards',
        subtitle: 'Practice with images and words',
        cta: 'Start',
        image: 'https://via.placeholder.com/300x160',
        variant: 'primary',
      },
      {
        key: 'multiple-choice',
        title: 'Multiple Choice',
        subtitle: 'Colourful answer buttons',
        cta: 'Start',
        variant: 'secondary',
      },
      {
        key: 'typing',
        title: 'Typing Prompt',
        subtitle: 'Type the translation',
        cta: 'Start',
        variant: 'primary',
      },
      {
        key: 'audio',
        title: 'Audio Prompt',
        subtitle: 'Speak your answer',
        cta: 'Start',
        variant: 'secondary',
      },
    ],
    []
  );

  return { modes: data, loading: false, error: null, refresh: () => {} };
}
