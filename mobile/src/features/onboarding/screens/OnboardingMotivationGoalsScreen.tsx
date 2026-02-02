import { router } from 'expo-router';

import { OptionQuestion } from '@/components/onboarding/_components';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function MotivationGoals() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    { 
      key: 'travel', 
      icon: 'airplane-outline', 
      label: 'For travel',
      description: 'Explore new places and cultures'
    },
    { 
      key: 'family', 
      icon: 'people-outline', 
      label: 'To connect with family/friends',
      description: 'Stay in touch with loved ones'
    },
    { 
      key: 'study', 
      icon: 'school-outline', 
      label: 'For study/career',
      description: 'Advance your professional goals'
    },
    { 
      key: 'fun', 
      icon: 'game-controller-outline', 
      label: 'For fun/personal growth',
      description: 'Learn something new for yourself'
    },
  ];

  return (
    <OptionQuestion
      step={1}
      title="What brings you here?"
      subtitle="Help us tailor your experience to match your goals"
      options={options}
      selected={answers.motivation?.key}
      onChange={(next) => {
        const nextKey = next[0];
        if (nextKey) setAnswerAndSave('motivation', { key: nextKey });
      }}
      onSkip={() => {
        setAnswerAndSave('motivation', null);
        router.push('/(onboarding)/2_preferred-learning');
      }}
      nextRoute="/(onboarding)/2_preferred-learning"
    />
  );
}
