import { OptionQuestion } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';

export default function SessionStyle() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    { key: 'short', icon: '⏱️', label: 'Short bursts (5–10 min)' },
    { key: 'focused', icon: '🎯', label: 'Focused blocks (20–30 min)' },
    { key: 'deep', icon: '🧠', label: 'Deep sessions (45+ min)' },
  ];

  return (
    <OptionQuestion
      step={7}
      title="Session style"
      options={options}
      selected={answers.sessionStyle ?? null}
      onChange={(next) => {
        const nextKey = next[0];
        if (nextKey) setAnswerAndSave('sessionStyle', nextKey);
      }}
      nextRoute="/onboarding/8_tone"
    />
  );
}
