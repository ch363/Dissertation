import { router } from 'expo-router';

import { OptionQuestion } from '@/components/onboarding';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function SessionStyle() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    { 
      key: 'short', 
      icon: 'time-outline', 
      label: 'Short bursts (5–10 min)',
      description: 'Quick practice sessions that fit your busy schedule'
    },
    { 
      key: 'focused', 
      icon: 'flag-outline', 
      label: 'Focused blocks (20–30 min)',
      description: 'Balanced sessions for steady progress'
    },
    { 
      key: 'deep', 
      icon: 'fitness-outline', 
      label: 'Deep sessions (45+ min)',
      description: 'Immersive learning for maximum retention'
    },
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
      onSkip={() => {
        setAnswerAndSave('sessionStyle', null);
        router.push('/(onboarding)/8_tone');
      }}
      nextRoute="/(onboarding)/8_tone"
    />
  );
}
