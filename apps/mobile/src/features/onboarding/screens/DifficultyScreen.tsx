import { OptionQuestion } from './_components';

import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function Difficulty() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    { key: 'easy', icon: '🙂', label: 'Keep it easy' },
    { key: 'balanced', icon: '⚖️', label: 'Balanced challenge' },
    { key: 'hard', icon: '🔥', label: 'Push me hard' },
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
      nextRoute="/onboarding/5_gamification"
    />
  );
}
