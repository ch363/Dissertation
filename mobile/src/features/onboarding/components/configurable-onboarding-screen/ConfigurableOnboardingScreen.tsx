/**
 * Configurable Onboarding Screen
 *
 * Generic onboarding screen component that renders based on configuration.
 * Eliminates code duplication across onboarding screens.
 */

import { router } from 'expo-router';
import React from 'react';

import { OptionQuestion } from '@/components/onboarding';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';
import { OnboardingScreenConfig } from '../../config/screens.config';

interface ConfigurableOnboardingScreenProps {
  config: OnboardingScreenConfig;
}

export const ConfigurableOnboardingScreen: React.FC<ConfigurableOnboardingScreenProps> = ({
  config,
}) => {
  const { answers, setAnswerAndSave } = useOnboarding();

  const selectedValue = answers[config.answerKey as keyof typeof answers] ?? null;

  const handleChange = (next: string[]) => {
    const nextKey = next[0];
    if (nextKey) {
      setAnswerAndSave(config.answerKey as keyof typeof answers, nextKey);
    }
  };

  const handleSkip = () => {
    setAnswerAndSave(config.answerKey as keyof typeof answers, null);
    router.push(config.nextRoute);
  };

  return (
    <OptionQuestion
      step={config.step}
      title={config.title}
      options={config.options}
      selected={selectedValue}
      onChange={handleChange}
      onSkip={handleSkip}
      nextRoute={config.nextRoute}
    />
  );
};

/**
 * Factory function to create onboarding screen component
 *
 * @param config - Screen configuration
 * @returns React component for the onboarding screen
 */
export function createOnboardingScreen(config: OnboardingScreenConfig) {
  return function OnboardingScreen() {
    return <ConfigurableOnboardingScreen config={config} />;
  };
}
