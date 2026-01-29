import { router } from 'expo-router';

import { OptionQuestion } from '@/components/onboarding/_components';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function Gamification() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    { key: 'light', icon: 'star-outline', label: 'Light gamification (streaks, stars)' },
    { key: 'none', icon: 'close-circle-outline', label: 'No gamification' },
    { key: 'full', icon: 'trophy-outline', label: 'Lots of challenges & rewards' },
  ];

  return (
    <OptionQuestion
      step={5}
      title="Gamification preference"
      options={options}
      selected={answers.gamification ?? null}
      onChange={(next) => {
        const nextKey = next[0];
        if (nextKey) setAnswerAndSave('gamification', nextKey);
      }}
      onSkip={() => {
        setAnswerAndSave('gamification', null);
        router.push('/(onboarding)/6_feedback-style');
      }}
      nextRoute="/(onboarding)/6_feedback-style"
    />
  );
}
