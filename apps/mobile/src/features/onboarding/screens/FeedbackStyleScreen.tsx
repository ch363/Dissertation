import { OptionQuestion } from './_components';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function FeedbackStyle() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    { key: 'gentle', icon: '🌤️', label: 'Gentle encouragement' },
    { key: 'direct', icon: '🧭', label: 'Direct and corrective' },
    { key: 'detailed', icon: '🔍', label: 'Detailed explanations' },
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
      nextRoute="/onboarding/7_session-style"
    />
  );
}
