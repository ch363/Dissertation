import { OptionQuestion } from '@/components/onboarding/_components';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function PreferredLearning() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    { key: 'visual', icon: '👀', label: 'Seeing pictures, diagrams, or written text' },
    { key: 'auditory', icon: '👂', label: 'Hearing sounds or spoken words' },
    { key: 'writing', icon: '✍️', label: 'Writing/typing out answers' },
    { key: 'acting', icon: '🎭', label: 'Acting it out / speaking it aloud' },
  ];

  return (
    <OptionQuestion
      step={2}
      title="Preferred Ways of Learning (choose up to 2)"
      options={options}
      selected={answers.learningStyles ?? []}
      onChange={(next) => setAnswerAndSave('learningStyles', next.slice(0, 2))}
      nextRoute="/onboarding/3_memory-habits"
      multiple
      maxSelections={2}
    />
  );
}
