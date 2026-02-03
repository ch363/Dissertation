import { router } from 'expo-router';

import { getCurrentUser } from '@/services/api/auth';
import { saveOnboarding } from '@/services/api/onboarding';
import { OptionQuestion } from '@/components/onboarding';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';

export default function ExperienceLevel() {
  const { setAnswerAndSave, answers } = useOnboarding();
  const selected = answers.experience ?? null;

  const options = [
    { 
      key: 'beginner', 
      icon: 'leaf-outline', 
      label: 'Beginner',
      description: 'Just starting out with the basics'
    },
    { 
      key: 'intermediate', 
      icon: 'flower-outline', 
      label: 'Intermediate',
      description: 'Some knowledge, ready to grow'
    },
    { 
      key: 'advanced', 
      icon: 'trending-up-outline', 
      label: 'Advanced',
      description: 'Strong foundation, seeking mastery'
    },
  ];

  const onFinish = async () => {
    const experienceValue = selected ?? '';
    setAnswerAndSave('experience', experienceValue);
    try {
      const user = await getCurrentUser();
      if (user) {
        await saveOnboarding(user.id, { ...answers, experience: experienceValue });
      }
    } catch {}
    router.replace('/(onboarding)/completion');
  };
  const onSkip = () => {
    setAnswerAndSave('experience', null);
    router.replace('/(onboarding)/completion');
  };

  return (
    <OptionQuestion
      step={9}
      title="What’s your experience level?"
      options={options}
      selected={selected}
      onChange={(next) => {
        const nextKey = next[0];
        if (nextKey) setAnswerAndSave('experience', nextKey);
      }}
      nextLabel="Finish"
      onNext={onFinish}
      onSkip={onSkip}
      nextRoute="/(onboarding)/completion"
    />
  );
}
