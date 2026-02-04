import { router } from 'expo-router';

import { OptionQuestion } from '@/components/onboarding';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function Difficulty() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    {
      key: 'easy',
      icon: 'happy-outline',
      label: 'Keep it easy',
      description: 'Comfortable pace with gentle progression',
    },
    {
      key: 'balanced',
      icon: 'scale-outline',
      label: 'Balanced challenge',
      description: 'Mix of review and new material',
    },
    {
      key: 'hard',
      icon: 'flame-outline',
      label: 'Push me hard',
      description: 'Aggressive learning with tough questions',
    },
  ];

  return (
    <OptionQuestion
      step={4}
      title="Preferred difficulty"
      options={options}
      selected={answers.difficulty ?? null}
      onChange={(next) => {
        const nextKey = next[0];
        if (nextKey) setAnswerAndSave('difficulty', nextKey);
      }}
      onSkip={() => {
        setAnswerAndSave('difficulty', null);
        router.push('/(onboarding)/5_gamification');
      }}
      nextRoute="/(onboarding)/5_gamification"
    />
  );
}
