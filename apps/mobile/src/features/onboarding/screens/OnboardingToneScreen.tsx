import { OptionQuestion } from '@/components/onboarding/_components';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function Tone() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    { key: 'friendly', icon: '😊', label: 'Friendly' },
    { key: 'professional', icon: '💼', label: 'Professional' },
    { key: 'playful', icon: '🎉', label: 'Playful' },
  ];

  return (
    <OptionQuestion
      step={8}
      title="Tone of voice"
      options={options}
      selected={answers.tone ?? null}
      onChange={(next) => {
        const nextKey = next[0];
        if (nextKey) setAnswerAndSave('tone', nextKey);
      }}
      nextRoute="/onboarding/9_experience-level"
    />
  );
}
