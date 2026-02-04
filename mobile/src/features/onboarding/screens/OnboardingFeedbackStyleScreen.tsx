import { router } from 'expo-router';

import { OptionQuestion } from '@/components/onboarding';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function FeedbackStyle() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    {
      key: 'gentle',
      icon: 'sunny-outline',
      label: 'Gentle encouragement',
      description: 'Positive reinforcement to build confidence',
    },
    {
      key: 'direct',
      icon: 'compass-outline',
      label: 'Direct and corrective',
      description: 'Straightforward feedback to fix mistakes quickly',
    },
    {
      key: 'detailed',
      icon: 'search-outline',
      label: 'Detailed explanations',
      description: 'In-depth guidance to understand why',
    },
  ];

  return (
    <OptionQuestion
      step={6}
      title="Feedback style"
      options={options}
      selected={answers.feedback ?? null}
      onChange={(next) => {
        const nextKey = next[0];
        if (nextKey) setAnswerAndSave('feedback', nextKey);
      }}
      onSkip={() => {
        setAnswerAndSave('feedback', null);
        router.push('/(onboarding)/7_session-style');
      }}
      nextRoute="/(onboarding)/7_session-style"
    />
  );
}
