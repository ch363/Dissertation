import { OptionQuestion } from './_components';

import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function MotivationGoals() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    { key: 'travel', icon: '🛫', label: 'For travel' },
    { key: 'family', icon: '👨‍👩‍👧', label: 'To connect with family/friends' },
    { key: 'study', icon: '🎓', label: 'For study/career' },
    { key: 'fun', icon: '🎮', label: 'For fun/personal growth' },
  ];

  return (
    <OptionQuestion
      step={1}
      title="Motivation & Goals"
      options={options}
      selected={answers.motivation?.key}
      onChange={(next) => {
        const nextKey = next[0];
        if (nextKey) setAnswerAndSave('motivation', { key: nextKey });
      }}
      nextRoute="/onboarding/2_preferred-learning"
    />
  );
}
