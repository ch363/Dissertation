import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';
import { OptionQuestion } from '@/components/onboarding/_components';

export default function Gamification() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    { key: 'light', icon: '🎯', label: 'Light gamification (streaks, stars)' },
    { key: 'none', icon: '🚫', label: 'No gamification' },
    { key: 'full', icon: '🏆', label: 'Lots of challenges & rewards' },
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
      nextRoute="/onboarding/6_feedback-style"
    />
  );
}
