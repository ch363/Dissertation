import { router } from 'expo-router';

import { OptionQuestion } from '@/components/onboarding';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function MemoryHabits() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    {
      key: 'spaced',
      icon: 'calendar-outline',
      label: 'Spaced repetition (flashcards, reviews)',
      description: 'Regular reviews over time for lasting memory',
    },
    {
      key: 'mnemonics',
      icon: 'bulb-outline',
      label: 'Mnemonics & stories',
      description: 'Creative associations and memorable narratives',
    },
    {
      key: 'immersion',
      icon: 'globe-outline',
      label: 'Context & immersion',
      description: 'Real-world situations and practical use',
    },
    {
      key: 'writing',
      icon: 'create-outline',
      label: 'Rewriting and note-taking',
      description: 'Active engagement through writing',
    },
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
