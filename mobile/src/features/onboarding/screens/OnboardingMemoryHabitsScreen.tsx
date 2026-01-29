import { router } from 'expo-router';

import { OptionQuestion } from '@/components/onboarding/_components';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function MemoryHabits() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    { key: 'spaced', icon: 'calendar-outline', label: 'Spaced repetition (flashcards, reviews)' },
    { key: 'mnemonics', icon: 'bulb-outline', label: 'Mnemonics & stories' },
    { key: 'immersion', icon: 'globe-outline', label: 'Context & immersion' },
    { key: 'writing', icon: 'create-outline', label: 'Rewriting and note-taking' },
  ];

  return (
    <OptionQuestion
      step={3}
      title="How do you usually remember best?"
      options={options}
      selected={answers.memoryHabit ?? null}
      onChange={(next) => {
        const nextKey = next[0];
        if (nextKey) setAnswerAndSave('memoryHabit', nextKey);
      }}
      onSkip={() => {
        setAnswerAndSave('memoryHabit', null);
        router.push('/(onboarding)/4_difficulty');
      }}
      nextRoute="/(onboarding)/4_difficulty"
    />
  );
}
