import { router } from 'expo-router';

import { OptionQuestion } from '@/components/onboarding';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function Tone() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    {
      key: 'friendly',
      icon: 'happy-outline',
      label: 'Friendly',
      description: 'Warm and approachable communication',
    },
    {
      key: 'professional',
      icon: 'briefcase-outline',
      label: 'Professional',
      description: 'Clear and business-like language',
    },
    {
      key: 'playful',
      icon: 'wine-outline',
      label: 'Playful',
      description: 'Fun and entertaining learning experience',
    },
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
      onSkip={() => {
        setAnswerAndSave('tone', null);
        router.push('/(onboarding)/9_experience-level');
      }}
      nextRoute="/(onboarding)/9_experience-level"
    />
  );
}
