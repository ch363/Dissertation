import { router } from 'expo-router';

import { OptionQuestion } from '@/components/onboarding/_components';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function PreferredLearning() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    { 
      key: 'visual', 
      icon: 'eye-outline', 
      label: 'Seeing pictures, diagrams, or written text',
      description: 'Learn through visual aids and reading'
    },
    { 
      key: 'auditory', 
      icon: 'volume-high-outline', 
      label: 'Hearing sounds or spoken words',
      description: 'Learn through listening and audio'
    },
    { 
      key: 'writing', 
      icon: 'create-outline', 
      label: 'Writing/typing out answers',
      description: 'Learn through active writing practice'
    },
    { 
      key: 'acting', 
      icon: 'mic-outline', 
      label: 'Acting it out / speaking it aloud',
      description: 'Learn through speaking and interaction'
    },
  ];

  return (
    <OptionQuestion
      step={2}
      title="Preferred Ways of Learning (choose up to 2)"
      options={options}
      selected={answers.learningStyles ?? []}
      onChange={(next) => setAnswerAndSave('learningStyles', next.slice(0, 2))}
      onSkip={() => {
        setAnswerAndSave('learningStyles', null);
        router.push('/(onboarding)/3_memory-habits');
      }}
      nextRoute="/(onboarding)/3_memory-habits"
      multiple
      maxSelections={2}
    />
  );
}
